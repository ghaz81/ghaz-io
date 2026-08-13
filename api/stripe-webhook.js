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

  // Fetch booking details for the email
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, mentorship_slots(*)')
    .eq('stripe_session_id', session.id)
    .single();

  if (booking) {
    const slotDate = new Date(booking.mentorship_slots.start_time).toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kuala_Lumpur'
    });

    // Email notification to you
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Ghaz.io Bookings <onboarding@resend.dev>',
        to: 'ghazanfar.iqbal@gmail.com',
        subject: `🎯 New Mentorship Booking: ${booking.mentee_name}`,
        html: `
          <h2>New 1:1 Booking Confirmed! 💰</h2>
          <table style="border-collapse:collapse;font-family:sans-serif;">
            <tr><td style="padding:8px;font-weight:bold;">Name:</td><td style="padding:8px;">${booking.mentee_name}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Email:</td><td style="padding:8px;"><a href="mailto:${booking.mentee_email}">${booking.mentee_email}</a></td></tr>
            <tr><td style="padding:8px;font-weight:bold;">LinkedIn:</td><td style="padding:8px;">${booking.mentee_linkedin || 'N/A'}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Topic:</td><td style="padding:8px;">${booking.topic}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Context:</td><td style="padding:8px;">${booking.context || 'None provided'}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Time (MYT):</td><td style="padding:8px;">${slotDate}</td></tr>
          </table>
          <hr style="margin:24px 0;">
          <p><strong>Next steps:</strong></p>
          <ol>
            <li>Create a Google Meet / Zoom link</li>
            <li>Reply to ${booking.mentee_email} with the link + calendar invite</li>
          </ol>
        `
      })
    });

    // Confirmation email to mentee
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Ghaz.io Bookings <onboarding@resend.dev>',
        to: booking.mentee_email,
        subject: `Confirmed: 1:1 Mentorship with Ghaz — ${slotDate}`,
        html: `
          <h2>You're booked! 🎉</h2>
          <p>Hi ${booking.mentee_name},</p>
          <p>Your 1:1 mentorship session with Ghaz is confirmed.</p>
          <table style="border-collapse:collapse;font-family:sans-serif;">
            <tr><td style="padding:8px;font-weight:bold;">When:</td><td style="padding:8px;">${slotDate} (Malaysia Time)</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Duration:</td><td style="padding:8px;">60 minutes</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Topic:</td><td style="padding:8px;">${booking.topic}</td></tr>
          </table>
          <p style="margin-top:16px;">You'll receive a meeting link (Google Meet) within 24 hours via a separate email.</p>
          <p>Come prepared with your top question — we'll make every minute count.</p>
          <br>
          <p>— Ghaz</p>
          <p style="font-size:12px;color:#8b8fa3;margin-top:24px;">Ghazanfar Iqbal · <a href="https://ghaz.io">ghaz.io</a></p>
        `
      })
    });
  }

  console.log(`✅ Payment confirmed + emails sent: ${session.id}`);
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
