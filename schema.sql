-- ============================================================
-- GangaView Resort, Rishikesh — Database Schema
-- MySQL / PostgreSQL Compatible
-- ============================================================

-- ===== DATABASE =====
CREATE DATABASE IF NOT EXISTS gangaview_resort;
USE gangaview_resort;

-- ============================================================
-- TABLE: rooms
-- ============================================================
CREATE TABLE rooms (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(100)    NOT NULL,
  type          VARCHAR(60)     NOT NULL,        -- 'Standard Room', 'Deluxe Room', etc.
  price         DECIMAL(10,2)   NOT NULL,        -- Per night in INR
  capacity      TINYINT         NOT NULL,
  size_sqft     VARCHAR(30),
  view_type     VARCHAR(100),
  description   TEXT,
  rating        DECIMAL(3,2)    DEFAULT 5.00,
  review_count  INT             DEFAULT 0,
  is_available  BOOLEAN         DEFAULT TRUE,
  created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- ===== SEED: Room Data =====
INSERT INTO rooms (name, type, price, capacity, size_sqft, view_type, description, rating, review_count) VALUES
('Garden View',         'Standard Room',  3499,  2, '320 sq ft', 'Garden View',
 'Cozy retreat with Himalayan garden views, handcrafted wooden furniture and organic cotton linens.',
 4.80, 124),

('River View Balcony',  'Deluxe Room',    5999,  2, '480 sq ft', 'Sacred Ganges River',
 'Private balcony over the Ganges. Watch sunrise paint the Himalayas gold. Premium rain shower and teak writing desk.',
 4.90, 287),

('Himalayan Panorama',  'Premium Suite',  11999, 4, '850 sq ft', '360° Himalayan View',
 'Full luxury 850 sq ft suite with outdoor jacuzzi, separate living area, and butler service.',
 5.00, 98),

('Yoga & Meditation',   'Private Cottage', 7499, 3, '600 sq ft', 'Forest & Mountain View',
 'Secluded forest cottage with private meditation deck, bamboo furnishings and daily yoga included.',
 4.90, 156);

-- ============================================================
-- TABLE: room_amenities
-- ============================================================
CREATE TABLE room_amenities (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  room_id     INT          NOT NULL,
  amenity     VARCHAR(100) NOT NULL,
  icon        VARCHAR(10),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

INSERT INTO room_amenities (room_id, amenity, icon) VALUES
(1, 'King Bed', '🛏'), (1, 'Ensuite Bathroom', '🚿'), (1, 'AC & Fan', '❄'),
(1, 'Free WiFi', '📶'), (1, 'Room Service', '🍽'), (1, 'Mini Fridge', '🧊'),
(2, 'King Bed', '🛏'), (2, 'Private River Balcony', '🌊'), (2, 'Rain Shower', '🚿'),
(2, 'Free WiFi', '📶'), (2, 'Mini Bar', '🍹'), (2, 'Yoga Mat', '🧘'),
(3, 'Super King Bed', '👑'), (3, 'Private Jacuzzi', '🛁'), (3, '360° Himalayan Balcony', '🌄'),
(3, 'Marble Bathroom', '✨'), (3, 'Butler on Call', '🤵'), (3, 'Airport Transfer', '✈'),
(4, 'Twin Beds', '🛏'), (4, 'Private Yoga Deck', '🌿'), (4, 'Forest Sit-Out', '🌲'),
(4, 'Daily Yoga Included', '🧘'), (4, 'Bicycle Rental', '🚲'), (4, 'Bonfire on Request', '🔥');

-- ============================================================
-- TABLE: room_images
-- ============================================================
CREATE TABLE room_images (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  room_id     INT           NOT NULL,
  image_url   VARCHAR(500)  NOT NULL,
  caption     VARCHAR(200),
  is_primary  BOOLEAN       DEFAULT FALSE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: guests
-- ============================================================
CREATE TABLE guests (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  full_name     VARCHAR(150)  NOT NULL,
  email         VARCHAR(200)  NOT NULL UNIQUE,
  phone         VARCHAR(20),
  nationality   VARCHAR(60),
  id_type       VARCHAR(40),     -- 'Aadhaar', 'Passport', 'PAN'
  id_number     VARCHAR(60),
  total_stays   INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: bookings
-- ============================================================
CREATE TABLE bookings (
  id                  VARCHAR(20)    PRIMARY KEY,    -- e.g. GVR-482901
  room_id             INT            NOT NULL,
  guest_id            INT,
  guest_name          VARCHAR(150)   NOT NULL,
  guest_email         VARCHAR(200)   NOT NULL,
  guest_phone         VARCHAR(20),
  checkin_date        DATE           NOT NULL,
  checkout_date       DATE           NOT NULL,
  nights              TINYINT        NOT NULL,
  num_guests          TINYINT        NOT NULL DEFAULT 1,
  price_per_night     DECIMAL(10,2)  NOT NULL,
  room_subtotal       DECIMAL(10,2)  NOT NULL,
  tax_amount          DECIMAL(10,2)  NOT NULL,
  total_amount        DECIMAL(10,2)  NOT NULL,
  special_requests    TEXT,
  status              ENUM('pending','confirmed','checked_in','checked_out','cancelled')
                                     DEFAULT 'confirmed',
  payment_status      ENUM('pending','paid','refunded') DEFAULT 'pending',
  payment_method      VARCHAR(60),
  created_at          TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id)  REFERENCES rooms(id),
  FOREIGN KEY (guest_id) REFERENCES guests(id)
);

-- ============================================================
-- TABLE: reviews
-- ============================================================
CREATE TABLE reviews (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  booking_id    VARCHAR(20)   NOT NULL,
  room_id       INT           NOT NULL,
  guest_name    VARCHAR(150)  NOT NULL,
  rating        TINYINT       CHECK (rating BETWEEN 1 AND 5),
  review_text   TEXT,
  location_tag  VARCHAR(60),  -- e.g. 'Mumbai', 'Delhi'
  stay_type     VARCHAR(60),  -- e.g. 'Couple', 'Family', 'Solo'
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (room_id)    REFERENCES rooms(id)
);

-- Seed reviews
INSERT INTO reviews (booking_id, room_id, guest_name, rating, review_text, location_tag, stay_type) VALUES
('GVR-SEED01', 2, 'Priya S.',  5, 'Waking up to the sound of Ganges every morning was life-changing. The yoga sessions at sunrise were magical.', 'Mumbai', 'Couple'),
('GVR-SEED02', 3, 'Rahul M.',  5, 'The Premium Suite jacuzzi with Himalayan views — nothing compares. Staff is incredibly warm.', 'Delhi', 'Couple'),
('GVR-SEED03', 4, 'Anjali K.', 5, 'Went for the rafting package and stayed at the Yoga Cottage. Perfect balance of adventure and peace.', 'Bangalore', 'Solo');

-- ============================================================
-- TABLE: experiences (add-ons guests can book)
-- ============================================================
CREATE TABLE experiences (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  duration    VARCHAR(40),
  price       DECIMAL(8,2),
  category    VARCHAR(60)   -- 'adventure', 'wellness', 'spiritual', 'food'
);

INSERT INTO experiences (name, description, duration, price, category) VALUES
('White-water Rafting',     'Guided rafting on Ganges Grade III-IV rapids',   '3 hours',  1499, 'adventure'),
('Bungee Jumping',          '83m jump over the Ganges valley',                '2 hours',  3500, 'adventure'),
('Sunrise Yoga Session',    'Mountain-view yoga with certified instructor',   '90 minutes', 599, 'wellness'),
('Ayurvedic Full Body Massage', 'Traditional Panchakarma treatment',         '90 minutes',2499, 'wellness'),
('Evening Ganga Aarti Tour','Private ghat access for the sacred Aarti ritual','2 hours',  799, 'spiritual'),
('Neelkanth Temple Trek',   'Guided 14km trek to the sacred Shiva temple',   'Full day',  1299, 'spiritual');

-- ============================================================
-- TABLE: booking_experiences (M-to-M)
-- ============================================================
CREATE TABLE booking_experiences (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  booking_id      VARCHAR(20) NOT NULL,
  experience_id   INT         NOT NULL,
  quantity        TINYINT     DEFAULT 1,
  FOREIGN KEY (booking_id)    REFERENCES bookings(id),
  FOREIGN KEY (experience_id) REFERENCES experiences(id)
);

-- ============================================================
-- USEFUL QUERIES
-- ============================================================

-- Get all bookings for a guest by email:
-- SELECT b.*, r.name as room_name FROM bookings b
-- JOIN rooms r ON b.room_id = r.id
-- WHERE b.guest_email = 'guest@example.com'
-- ORDER BY b.created_at DESC;

-- Get available rooms for a date range:
-- SELECT r.* FROM rooms r
-- WHERE r.is_available = TRUE
-- AND r.id NOT IN (
--   SELECT room_id FROM bookings
--   WHERE status NOT IN ('cancelled')
--   AND checkin_date < '2025-12-25'
--   AND checkout_date > '2025-12-20'
-- );

-- Revenue report by month:
-- SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
--   COUNT(*) as bookings,
--   SUM(total_amount) as revenue
-- FROM bookings WHERE status != 'cancelled'
-- GROUP BY month ORDER BY month DESC;

-- Average rating per room:
-- SELECT r.name, AVG(rv.rating) as avg_rating, COUNT(*) as total_reviews
-- FROM rooms r
-- LEFT JOIN reviews rv ON r.id = rv.room_id
-- GROUP BY r.id;
