// ============================================
// VERCEL SERVERLESS FUNCTION: /api/stripe-webhook
// Handles Stripe payment confirmations
// ============================================

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Disable body parsing — Stripe needs the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let event;

  try {
    // Get raw body for signature verification
    const rawBody = await buffer(req);
    const sig = req.headers['stripe-signature'];

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        // Update booking to paid
        await supabase
          .from('bookings')
          .update({ payment_status: 'paid' })
          .eq('stripe_session_id', session.id);

        console.log(`✅ Payment confirmed for session: ${session.id}`);

        // TODO: Send confirmation email (integrate Resend/SendGrid here)
        // TODO: Create Google Meet / Zoom link
        // TODO: Send yourself a Slack/email notification

        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;

        // Mark booking as failed
        const { data: booking } = await supabase
          .from('bookings')
          .update({ payment_status: 'failed' })
          .eq('stripe_session_id', session.id)
          .select('slot_id')
          .single();

        // Release the slot back to available
        if (booking?.slot_id) {
          await supabase
            .from('mentorship_slots')
            .update({ status: 'available' })
            .eq('id', booking.slot_id);
        }

        console.log(`⏰ Checkout expired, slot released: ${session.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}
