# 🪔 Diwali Spark — Crackers E-Commerce Store & Admin Tracking System

A full-stack, festive Diwali crackers shopping portal designed in an elegant **Red & White** theme, built with **React (Pure CSS, strictly no Tailwind)** and an **Express + SQLite** backend.

---

## 🌟 Key Highlights & User Requirements Addressed

1. **Festive Red & White Aesthetic**:
   - Styled with pure CSS variables and custom components — crimson red, ruby accents, crisp whites, subtle glowing borders, and gold badges.
   - Strictly standard CSS (`index.css`) without Tailwind CSS.

2. **Form-Based Order Checkout (No Account / Login Required to Order)**:
   - Customers add crackers to their cart and click **"Submit Cart & Fill Delivery Form"**.
   - Opens the customer details form collecting:
     - **Full Name**
     - **Mobile Number** (used for lookup & delivery updates)
     - **Email Address** (optional)
     - **Door No / Street Address**
     - **City / Town**
     - **Pincode**
     - **Special Delivery Instructions**
   - Submits the order and immediately generates a unique Order Tracking ID (e.g. `CRK-2026-XXXX`) with copy-to-clipboard functionality and confetti celebration.

3. **Customer Order Tracking (No Login Required)**:
   - Dedicated **"Track Order"** tab where customers can look up their orders using either their **Mobile Phone Number** OR **Order ID**.
   - Visual 5-step milestone progress bar:
     `Pending` ➔ `Confirmed` ➔ `Packed` ➔ `Out for Delivery` ➔ `Delivered`
   - Real-time timestamped status log, courier partner name, and AWB tracking numbers.

4. **Top-to-Bottom Store Admin Panel**:
   - Admin Login credentials:
     - **Username**: `admin`
     - **Password**: `diwali@2026`
   - **Dashboard Overview**:
     - Metric cards: Total Revenue (₹), Total Orders, Pending Orders, In-Transit / Packed, Delivered Orders.
   - **Order Management**:
     - Filter orders by status or search by customer name, phone, city, or order ID.
     - Fast status selector dropdown.
     - **Courier & Tracking Modal**: assign courier partners (DTDC, Blue Dart, etc.), add tracking numbers, and add customer-facing status notes.
     - View complete order breakdowns (products, quantities, subtotals, customer address).
   - **Crackers Catalog Management (CRUD)**:
     - Add new crackers with name, category, price, MRP, pack size, image URL, and description.
     - Edit existing crackers or toggle stock (`In Stock` / `Sold Out`).
     - Delete crackers.

5. **Full Diwali Crackers Catalog**:
   - Pre-seeded with 22 authentic Diwali crackers across all 7 requested categories:
     - **Sparklers** (Electric sparklers, green crackling, golden shower, mega colour)
     - **Flower pots** (Asoka special, deluxe tri-colour, giant colour koti)
     - **Rockets** (Whistling rocket, Lunik sky rocket, parachute floating rocket)
     - **Chakras** (Ground chakkar special, deluxe big, disco spinning wheel)
     - **Bombs** (Classic Laxmi bomb, hydro mega sound, digital 28 chorsa)
     - **Fancy items** (7 shots peacock, 12 shots sky symphony, magic butterfly)
     - **Gift boxes** (Diwali Family Jumbo Box 35 items, Royal VIP Hamper 50 items, Kids Joy Combo)

6. **Database Decision**:
   - **SQLite**: Lightning fast, zero external software installation, persistent disk storage (`server/diwali.db`), portable, and ACID-compliant.

---

## 🚀 How to Run

The server and frontend are already running and configured!

### Live URLs:
- **Web App (Storefront & Admin)**: `http://localhost:5000` (or `http://localhost:5173` if running Vite dev)
- **API Health Check**: `http://localhost:5000/api/health`
- **Products API**: `http://localhost:5000/api/products`

### Commands:
```bash
# Start backend server
cd server
node server.js

# Or start client in Vite dev mode (with hot reloading)
cd client
npm run dev
```

### Order email notifications

Every successful checkout sends the complete order and delivery details, item breakdown, total, and generated order tracking ID to `dinosaurcrackersofficial@gmail.com`. Set SMTP credentials on the backend host in `server/.env` (never in the client):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-sending-address@gmail.com
SMTP_PASS=your-16-character-google-app-password
SMTP_FROM=your-sending-address@gmail.com
```

For Gmail, enable 2-Step Verification and create an App Password; use that password as `SMTP_PASS`, not your normal Google password. Restart the backend after setting these values. Without SMTP configuration the order is still saved, but no email can be sent. The checkout email contains the app's order tracking ID; the carrier AWB becomes available only after a courier is assigned in the admin panel.

### Admin Credentials:
- **Username**: `admin`
- **Password**: `diwali@2026`
*(Quick "Auto-Fill" button is also available on the login modal for instant 1-click access)*
