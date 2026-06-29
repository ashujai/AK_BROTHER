// ============================================================
// GangaView Resort – Rishikesh
// app.js – Frontend Logic + SQL-backed Booking Storage Simulation
// ============================================================

// ===== SQL DATABASE SIMULATION (localStorage as SQL store) =====
// In production: replace with actual MySQL/PostgreSQL via REST API

const DB = {
  // --- Schema ---
  // TABLE: rooms (id, name, type, price, capacity, size, view, amenities, images, rating, reviews)
  // TABLE: bookings (id, room_id, guest_name, guest_email, guest_phone, checkin, checkout, guests, total, status, created_at)

  rooms: [
    {
      id: 1, name: "Garden View", type: "Standard Room",
      price: 3499, capacity: 2, size: "320 sq ft", view: "Garden View",
      description: "A cozy retreat surrounded by lush Himalayan gardens. Wake up to birds and morning mist. Perfect for travelers seeking comfort without excess — featuring handcrafted wooden furniture, organic cotton linens, and a private ensuite bathroom with herbal toiletries.",
      amenities: ["King Bed", "Ensuite Bathroom", "AC & Fan", "Free WiFi", "Room Service", "Mini Fridge", "Flat Screen TV", "Tea/Coffee Maker"],
      img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
      rating: 4.8, reviews: 124
    },
    {
      id: 2, name: "River View Balcony", type: "Deluxe Room",
      price: 5999, capacity: 2, size: "480 sq ft", view: "Sacred Ganges River",
      description: "Our most sought-after accommodation. Your private balcony hangs over the sacred Ganges — watch sunrise paint the Himalayas gold every morning. Featuring premium cotton bedding, a stone-tiled rain shower, and a hand-carved teak writing desk with river views.",
      amenities: ["King Bed", "Private River Balcony", "Rain Shower", "AC & Fan", "Free WiFi", "Room Service", "Mini Bar", "Flat Screen TV", "Yoga Mat", "Himalayan Salt Lamp"],
      img: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
      rating: 4.9, reviews: 287
    },
    {
      id: 3, name: "Himalayan Panorama", type: "Premium Suite",
      price: 11999, capacity: 4, size: "850 sq ft", view: "360° Himalayan View",
      description: "The crown jewel of GangaView Resort. A full 850 sq ft of luxury including a king bedroom, separate living area, and an outdoor jacuzzi with unobstructed views of the Himalayan range and Ganges valley. Reserved for those who seek the ultimate Rishikesh experience.",
      amenities: ["Super King Bed", "Private Jacuzzi", "Separate Living Room", "360° Himalayan Balcony", "Marble Bathroom", "Premium Mini Bar", "Concierge Service", "Butler on Call", "Yoga Deck", "Airport Transfer Included"],
      img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
      rating: 5.0, reviews: 98
    },
    {
      id: 4, name: "Yoga & Meditation", type: "Private Cottage",
      price: 7499, capacity: 3, size: "600 sq ft", view: "Forest & Mountain View",
      description: "A secluded forest cottage designed for those on a deeper journey. Features a private meditation deck, twin beds ideal for friends or couples, bamboo furnishings, and an outdoor sit-out surrounded by Devdar cedar trees. Morning yoga sessions included for cottage guests.",
      amenities: ["Twin Beds", "Private Yoga Deck", "Meditation Cushions", "Forest Sit-Out", "Organic Bathroom", "Free WiFi", "Daily Yoga Included", "Bicycle Rental", "Nature Walk Map", "Bonfire on Request"],
      img: "https://images.unsplash.com/photo-1535827841776-24afc1e255ac?w=800&q=80",
      rating: 4.9, reviews: 156
    }
  ],

  bookings: JSON.parse(localStorage.getItem('gangaview_bookings') || '[]'),

  // SQL: INSERT INTO bookings ...
  createBooking(data) {
    const booking = {
      id: 'GVR-' + Date.now().toString().slice(-6),
      ...data,
      status: 'confirmed',
      created_at: new Date().toISOString()
    };
    this.bookings.push(booking);
    localStorage.setItem('gangaview_bookings', JSON.stringify(this.bookings));
    return booking;
  },

  // SQL: SELECT * FROM rooms WHERE type = ?
  getRoomByType(type) {
    const typeMap = { standard: 1, deluxe: 2, suite: 3, cottage: 4 };
    return this.rooms.find(r => r.id === typeMap[type]) || this.rooms[0];
  },

  // SQL: SELECT * FROM bookings WHERE guest_email = ?
  getBookingsByEmail(email) {
    return this.bookings.filter(b => b.guest_email === email);
  },

  // SQL: SELECT * FROM bookings WHERE id = ?
  getBookingById(id) {
    return this.bookings.find(b => b.id === id);
  }
};

// ===== ROOM DATA KEYS =====
const roomKeys = { standard: 0, deluxe: 1, suite: 2, cottage: 3 };

// ===== CURRENT BOOKING STATE =====
let currentRoom = null;
let currentPrice = 0;

// ===== NAV =====
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

// Sticky nav color change
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  nav.style.background = window.scrollY > 60
    ? 'rgba(27,67,50,0.99)'
    : 'rgba(27,67,50,0.96)';
});

// ===== DATE DEFAULTS =====
window.addEventListener('DOMContentLoaded', () => {
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);

  const fmt = d => d.toISOString().split('T')[0];

  ['checkin', 'checkout'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = fmt(id === 'checkin' ? tomorrow : dayAfter);
  });
});

function updateCheckout() {
  const ci = document.getElementById('checkin');
  const co = document.getElementById('checkout');
  if (ci && co) {
    const ciDate = new Date(ci.value);
    ciDate.setDate(ciDate.getDate() + 1);
    co.value = ciDate.toISOString().split('T')[0];
  }
}

// ===== ROOM SEARCH =====
function searchRooms() {
  const ci = document.getElementById('checkin').value;
  const co = document.getElementById('checkout').value;
  if (!ci || !co) { showToast('⚠ Please select check-in and check-out dates'); return; }
  if (new Date(co) <= new Date(ci)) { showToast('⚠ Check-out must be after check-in'); return; }

  const nights = Math.ceil((new Date(co) - new Date(ci)) / (1000 * 60 * 60 * 24));
  showToast(`✅ Showing rooms for ${nights} night${nights > 1 ? 's' : ''}`);

  document.getElementById('rooms').scrollIntoView({ behavior: 'smooth' });

  // Animate room cards
  document.querySelectorAll('.room-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.4s, transform 0.4s';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, i * 100);
  });
}

// ===== ROOM DETAIL MODAL =====
function openModal(type) {
  const room = DB.getRoomByType(type);
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');

  const amenityIcons = { "King Bed": "🛏", "Ensuite Bathroom": "🚿", "AC & Fan": "❄", "Free WiFi": "📶", "Room Service": "🍽", "Mini Fridge": "🧊", "Flat Screen TV": "📺", "Tea/Coffee Maker": "☕", "Private River Balcony": "🌊", "Rain Shower": "🚿", "Mini Bar": "🍹", "Himalayan Salt Lamp": "🏔", "Yoga Mat": "🧘", "Jacuzzi": "🛁", "Super King Bed": "👑", "Private Jacuzzi": "🛁", "Separate Living Room": "🛋", "360° Himalayan Balcony": "🌄", "Marble Bathroom": "✨", "Premium Mini Bar": "🍾", "Concierge Service": "🛎", "Butler on Call": "🤵", "Yoga Deck": "🧘", "Airport Transfer Included": "✈", "Twin Beds": "🛏", "Private Yoga Deck": "🌿", "Meditation Cushions": "🧘", "Forest Sit-Out": "🌲", "Organic Bathroom": "🌿", "Daily Yoga Included": "🧘", "Bicycle Rental": "🚲", "Nature Walk Map": "🗺", "Bonfire on Request": "🔥", "Concierge Service": "🛎", "Butler on Call": "🤵" };

  const amenHTML = room.amenities.map(a =>
    `<div class="modal-feature">${amenityIcons[a] || '✓'} ${a}</div>`
  ).join('');

  content.innerHTML = `
    <img src="${room.img}" alt="${room.name}" class="modal-room-img">
    <div class="modal-room-body">
      <div class="modal-room-sub">${room.type}</div>
      <div class="modal-room-title">${room.name}</div>
      <div style="color:#F59E0B;margin-bottom:8px">
        ${'★'.repeat(Math.floor(room.rating))} ${room.rating} <span style="color:#6B7280;font-size:13px">(${room.reviews} reviews)</span>
      </div>
      <div class="modal-price-tag">₹${room.price.toLocaleString('en-IN')} <small>/night</small></div>
      <p class="modal-desc">${room.description}</p>
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#1B4332;margin-bottom:12px">Room Details</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px">
        <span style="background:#F0FDF4;color:#166534;padding:6px 14px;border-radius:50px;font-size:13px">📐 ${room.size}</span>
        <span style="background:#F0FDF4;color:#166534;padding:6px 14px;border-radius:50px;font-size:13px">👥 Up to ${room.capacity} guests</span>
        <span style="background:#F0FDF4;color:#166534;padding:6px 14px;border-radius:50px;font-size:13px">🌿 ${room.view}</span>
      </div>
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#1B4332;margin-bottom:12px">Included Amenities</div>
      <div class="modal-features-grid">${amenHTML}</div>
      <button class="modal-book-btn" onclick="closeModal(); bookRoom('${type}', ${room.price})">
        Book ${room.name} – ₹${room.price.toLocaleString('en-IN')}/night
      </button>
    </div>
  `;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ===== BOOKING MODAL =====
function bookRoom(type, price) {
  currentRoom = DB.getRoomByType(type);
  currentPrice = price;

  const ci = document.getElementById('checkin')?.value || '';
  const co = document.getElementById('checkout')?.value || '';
  const nights = ci && co ? Math.ceil((new Date(co) - new Date(ci)) / 86400000) : 1;
  const roomTotal = price * nights;
  const tax = Math.round(roomTotal * 0.12);
  const total = roomTotal + tax;

  const overlay = document.getElementById('bookingOverlay');
  const content = document.getElementById('bookingContent');

  content.innerHTML = `
    <div class="booking-modal-inner">
      <div class="booking-modal-title">🏨 Book Your Room</div>
      <div class="booking-modal-sub">${currentRoom.type} – ${currentRoom.name}</div>

      <div class="b-form-group">
        <label>Full Name</label>
        <input type="text" id="b_name" placeholder="Your full name" />
      </div>
      <div class="b-form-group">
        <label>Email Address</label>
        <input type="email" id="b_email" placeholder="your@email.com" />
      </div>
      <div class="b-form-group">
        <label>Phone Number</label>
        <input type="tel" id="b_phone" placeholder="+91 98765 43210" />
      </div>
      <div class="b-row">
        <div class="b-form-group">
          <label>Check-In</label>
          <input type="date" id="b_checkin" value="${ci}" />
        </div>
        <div class="b-form-group">
          <label>Check-Out</label>
          <input type="date" id="b_checkout" value="${co}" onchange="updatePriceSummary()" />
        </div>
      </div>
      <div class="b-form-group">
        <label>Number of Guests</label>
        <select id="b_guests">
          ${[1,2,3,4].map(n => `<option ${n===2?'selected':''}>${n} Guest${n>1?'s':''}</option>`).join('')}
        </select>
      </div>
      <div class="b-form-group">
        <label>Special Requests (Optional)</label>
        <input type="text" id="b_requests" placeholder="e.g. Early check-in, River view preferred…" />
      </div>

      <div class="price-summary" id="priceSummary">
        <div class="price-row"><span>₹${price.toLocaleString('en-IN')} × ${nights} night${nights>1?'s':''}</span><span>₹${roomTotal.toLocaleString('en-IN')}</span></div>
        <div class="price-row"><span>Taxes & fees (12%)</span><span>₹${tax.toLocaleString('en-IN')}</span></div>
        <div class="price-row total"><span>Total</span><span>₹${total.toLocaleString('en-IN')}</span></div>
      </div>

      <button class="confirm-btn" onclick="confirmBooking()">
        ✓ Confirm Booking – ₹${total.toLocaleString('en-IN')}
      </button>
      <p style="text-align:center;font-size:12px;color:#9CA3AF;margin-top:12px">
        🔒 Free cancellation up to 24 hours before check-in
      </p>
    </div>
  `;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function updatePriceSummary() {
  const ci = document.getElementById('b_checkin')?.value;
  const co = document.getElementById('b_checkout')?.value;
  if (!ci || !co || !currentPrice) return;
  const nights = Math.ceil((new Date(co) - new Date(ci)) / 86400000);
  if (nights < 1) return;
  const roomTotal = currentPrice * nights;
  const tax = Math.round(roomTotal * 0.12);
  const total = roomTotal + tax;
  const summary = document.getElementById('priceSummary');
  if (summary) {
    summary.innerHTML = `
      <div class="price-row"><span>₹${currentPrice.toLocaleString('en-IN')} × ${nights} night${nights>1?'s':''}</span><span>₹${roomTotal.toLocaleString('en-IN')}</span></div>
      <div class="price-row"><span>Taxes & fees (12%)</span><span>₹${tax.toLocaleString('en-IN')}</span></div>
      <div class="price-row total"><span>Total</span><span>₹${total.toLocaleString('en-IN')}</span></div>
    `;
    document.querySelector('.confirm-btn').textContent = `✓ Confirm Booking – ₹${total.toLocaleString('en-IN')}`;
  }
}

function confirmBooking() {
  const name = document.getElementById('b_name')?.value.trim();
  const email = document.getElementById('b_email')?.value.trim();
  const phone = document.getElementById('b_phone')?.value.trim();
  const ci = document.getElementById('b_checkin')?.value;
  const co = document.getElementById('b_checkout')?.value;
  const guests = document.getElementById('b_guests')?.value;
  const requests = document.getElementById('b_requests')?.value || '';

  // Validation
  if (!name) { showToast('⚠ Please enter your name'); return; }
  if (!email || !email.includes('@')) { showToast('⚠ Please enter a valid email'); return; }
  if (!phone || phone.length < 8) { showToast('⚠ Please enter a valid phone number'); return; }
  if (!ci || !co) { showToast('⚠ Please select dates'); return; }
  if (new Date(co) <= new Date(ci)) { showToast('⚠ Check-out must be after check-in'); return; }

  const nights = Math.ceil((new Date(co) - new Date(ci)) / 86400000);
  const roomTotal = currentPrice * nights;
  const tax = Math.round(roomTotal * 0.12);
  const total = roomTotal + tax;

  // SQL: INSERT INTO bookings ...
  const booking = DB.createBooking({
    room_id: currentRoom.id,
    room_name: currentRoom.name,
    room_type: currentRoom.type,
    guest_name: name,
    guest_email: email,
    guest_phone: phone,
    checkin: ci,
    checkout: co,
    nights,
    guests,
    special_requests: requests,
    price_per_night: currentPrice,
    room_total: roomTotal,
    tax,
    total
  });

  closeBooking();
  showSuccessModal(booking);
}

function showSuccessModal(booking) {
  const overlay = document.getElementById('bookingOverlay');
  const content = document.getElementById('bookingContent');

  content.innerHTML = `
    <div class="booking-modal-inner" style="text-align:center">
      <div style="font-size:64px;margin-bottom:16px">✅</div>
      <h2 style="font-family:'Playfair Display',serif;color:#1B4332;font-size:26px;margin-bottom:8px">Booking Confirmed!</h2>
      <p style="color:#6B7280;margin-bottom:24px">Thank you, ${booking.guest_name}! Your retreat is reserved.</p>

      <div style="background:#F0FDF4;border-radius:12px;padding:20px;text-align:left;margin-bottom:24px">
        <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#166534;text-transform:uppercase;margin-bottom:14px">Booking Details</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;justify-content:space-between;font-size:14px"><span style="color:#6B7280">Booking ID</span><strong style="color:#1B4332">${booking.id}</strong></div>
          <div style="display:flex;justify-content:space-between;font-size:14px"><span style="color:#6B7280">Room</span><strong>${booking.room_name}</strong></div>
          <div style="display:flex;justify-content:space-between;font-size:14px"><span style="color:#6B7280">Check-In</span><strong>${formatDate(booking.checkin)}</strong></div>
          <div style="display:flex;justify-content:space-between;font-size:14px"><span style="color:#6B7280">Check-Out</span><strong>${formatDate(booking.checkout)}</strong></div>
          <div style="display:flex;justify-content:space-between;font-size:14px"><span style="color:#6B7280">Nights</span><strong>${booking.nights}</strong></div>
          <div style="display:flex;justify-content:space-between;font-size:14px"><span style="color:#6B7280">Guests</span><strong>${booking.guests}</strong></div>
          <div style="display:flex;justify-content:space-between;font-size:14px;border-top:1px solid #BBF7D0;padding-top:8px;margin-top:4px"><span style="color:#6B7280">Total Paid</span><strong style="color:#1B4332;font-size:16px">₹${booking.total.toLocaleString('en-IN')}</strong></div>
        </div>
      </div>

      <p style="font-size:13px;color:#6B7280;margin-bottom:20px">
        📧 Confirmation sent to <strong>${booking.guest_email}</strong><br>
        📞 Questions? Call us at <strong>+91 98765 43210</strong>
      </p>

      <button onclick="closeBooking()" style="background:linear-gradient(135deg,#1B4332,#2D6A4F);color:white;border:none;padding:13px 32px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;width:100%">
        Done – Can't Wait to See You! 🙏
      </button>
    </div>
  `;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeBooking() {
  document.getElementById('bookingOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ===== UTILS =====
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ===== SCROLL ANIMATIONS =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.room-card, .amen-card, .review-card, .g-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s';
    observer.observe(el);
  });
});
