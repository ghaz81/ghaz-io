// ============================================
// GHAZ.IO MENTORSHIP BOOKING — Client-Side Logic
// ============================================

// ⚠️ REPLACE THESE with your actual Supabase credentials
const SUPABASE_URL = 'https://xzzapctcezpnrnjhrhnb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6emFwY3RjZXpwbnJuamhyaG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1ODM0MTMsImV4cCI6MjEwMjE1OTQxM30.bqh6qW2pBzg802RUb5ZEk0g-qVM58mtxX9gm72Ekv1A';

// Initialize Supabase client
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let selectedSlot = null;

// ============================================
// ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Check if returning from successful payment
  const params = new URLSearchParams(window.location.search);
  if (params.get('confirmed') === '1' || params.get('session_id')) {
    showConfirmed();
    return;
  }

  // Load available slots
  loadSlots();
});

// ============================================
// LOAD AVAILABLE SLOTS FROM SUPABASE
// ============================================
async function loadSlots() {
  const container = document.getElementById('slots-container');

  try {
    const { data: slots, error } = await sb
      .from('mentorship_slots')
      .select('*')
      .eq('status', 'available')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (error) throw error;

    if (!slots || slots.length === 0) {
      container.innerHTML = `
        <div class="slots-empty">
          <p>No slots available right now.</p>
          <p style="margin-top: 8px;">Check back soon or <a href="mailto:ghazanfar.iqbal@gmail.com" style="color: var(--terracotta);">email me</a> to request a time.</p>
        </div>`;
      return;
    }

    container.innerHTML = slots.map(slot => {
      const start = new Date(slot.start_time);
      const dateStr = start.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
      const timeStr = start.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const price = (slot.price_cents / 100).toFixed(0);

      return `
        <div class="slot-card" data-slot-id="${slot.id}" onclick="selectSlot('${slot.id}', this)">
          <div>
            <div class="slot-date">${dateStr}</div>
            <div class="slot-time">${timeStr} • $${price} USD</div>
          </div>
          <div class="slot-duration">${slot.duration_minutes} min</div>
        </div>`;
    }).join('');

  } catch (err) {
    console.error('Error loading slots:', err);
    container.innerHTML = `
      <div class="slots-empty">
        <p>Couldn't load available times. Please refresh the page.</p>
      </div>`;
  }
}

// ============================================
// SELECT A SLOT
// ============================================
function selectSlot(slotId, element) {
  // Remove previous selection
  document.querySelectorAll('.slot-card').forEach(el => el.classList.remove('selected'));

  // Mark as selected
  element.classList.add('selected');
  selectedSlot = slotId;

  // Show the booking form
  const form = document.getElementById('booking-form');
  form.classList.add('visible');
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// HANDLE BOOKING → REDIRECT TO STRIPE
// ============================================
async function handleBooking() {
  const btn = document.getElementById('btn-book');

  // Gather form data
  const name = document.getElementById('mentee-name').value.trim();
  const email = document.getElementById('mentee-email').value.trim();
  const linkedin = document.getElementById('mentee-linkedin').value.trim();
  const topic = document.getElementById('mentee-topic').value.trim();
  const context = document.getElementById('mentee-context').value.trim();

  // Validate
  if (!name || !email || !topic) {
    alert('Please fill in all required fields (Name, Email, Topic).');
    return;
  }

  if (!selectedSlot) {
    alert('Please select a time slot first.');
    return;
  }

  // Disable button
  btn.disabled = true;
  btn.textContent = 'Creating checkout session...';

  try {
    // Call our Vercel serverless function
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId: selectedSlot,
        name,
        email,
        linkedin,
        topic,
        context
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    // Redirect to Stripe Checkout
    window.location.href = data.url;

  } catch (err) {
    console.error('Booking error:', err);
    alert('Something went wrong: ' + err.message + '\n\nPlease try again.');
    btn.disabled = false;
    btn.textContent = 'Proceed to Payment →';
  }
}

// ============================================
// SHOW CONFIRMED STATE
// ============================================
function showConfirmed() {
  document.getElementById('main-content').style.display = 'none';
  document.getElementById('confirmed').classList.add('visible');
}
