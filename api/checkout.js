// ============================================
// VERCEL SERVERLESS FUNCTION: /api/checkout
// Creates a Stripe Checkout Session
// ============================================

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slotId, name, email, linkedin, topic, context } = req.body;

    // Validate required fields
    if (!slotId || !name || !email || !topic) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch the slot from Supabase
    const { data: slot, error: slotError } = await supabase
      .from('mentorship_slots')
      .select('*')
      .eq('id', slotId)
      .eq('status', 'available')
      .single();

    if (slotError || !slot) {
      return res.status(400).json({ error: 'This slot is no longer available' });
    }

    // Format the session date for Stripe description
    const sessionDate = new Date(slot.start_time).toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `1:1 Mentorship with Ghaz`,
            description: `${slot.duration_minutes} min session — ${sessionDate}\nTopic: ${topic}`,
          },
          unit_amount: slot.price_cents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.SITE_URL}/mentorship?confirmed=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/mentorship`,
      customer_email: email,
      metadata: {
        slot_id: slotId,
        mentee_name: name,
      },
    });

    // Create booking record in Supabase
    const { error: bookingError } = await supabase
      .from('bookings')
      .insert({
        slot_id: slotId,
        mentee_name: name,
        mentee_email: email,
        mentee_linkedin: linkedin || null,
        topic,
        context: context || null,
        stripe_session_id: session.id,
        payment_status: 'pending',
      });

    if (bookingError) {
      console.error('Booking insert error:', bookingError);
      // Don't fail the checkout — payment still matters
    }

    // Reserve the slot (mark as booked)
    await supabase
      .from('mentorship_slots')
      .update({ status: 'booked' })
      .eq('id', slotId);

    // Return checkout URL
    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
