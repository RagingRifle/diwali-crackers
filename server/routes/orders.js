const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

// Helper to generate readable Order ID: e.g. CRK-2026-7842
function generateOrderId() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `CRK-${year}-${randomNum}`;
}

// POST /api/orders - Customer places order (No login required)
router.post('/', async (req, res) => {
  try {
    const {
      customer_name,
      phone,
      email,
      address,
      city,
      pincode,
      notes,
      items
    } = req.body;

    // Validation
    if (!customer_name || !phone || !address || !city || !pincode) {
      return res.status(400).json({ error: 'Please fill in all mandatory delivery fields.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty. Please add crackers to order.' });
    }

    const db = await getDb();

    // Calculate total amount
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const qty = parseInt(item.quantity, 10) || 1;
      const price = parseFloat(item.price) || 0;
      const subtotal = price * qty;
      totalAmount += subtotal;

      validatedItems.push({
        product_id: item.id || null,
        product_name: item.name || 'Cracker Item',
        price,
        quantity: qty,
        subtotal
      });
    }

    let orderId = generateOrderId();
    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 5) {
      const exists = db.get("SELECT id FROM orders WHERE id = ?", [orderId]);
      if (!exists) break;
      orderId = generateOrderId();
      attempts++;
    }

    const now = new Date().toISOString();
    const initialStatusUpdates = JSON.stringify([
      {
        status: 'Pending',
        timestamp: now,
        note: 'Order submitted successfully and received by our festive dispatch team.'
      }
    ]);

    // Insert order
    db.run(`
      INSERT INTO orders (
        id, customer_name, phone, email, address, city, pincode,
        notes, total_amount, status, courier_name, tracking_number,
        status_updates, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', '', '', ?, ?)
    `, [
      orderId,
      customer_name.trim(),
      phone.trim(),
      email ? email.trim() : '',
      address.trim(),
      city.trim(),
      pincode.trim(),
      notes ? notes.trim() : '',
      totalAmount,
      initialStatusUpdates,
      now
    ]);

    // Insert order items
    for (const item of validatedItems) {
      db.run(`
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [orderId, item.product_id, item.product_name, item.price, item.quantity, item.subtotal]);
    }

    db.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      orderId,
      totalAmount,
      customerName: customer_name
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to place order. Please try again.' });
  }
});

// GET /api/orders/track - Public tracking lookup by phone or orderId
router.get('/track', async (req, res) => {
  try {
    const { orderId, phone } = req.query;

    if (!orderId && !phone) {
      return res.status(400).json({ error: 'Please provide an Order ID or Phone Number to track your delivery.' });
    }

    const db = await getDb();
    let orders = [];

    if (orderId && orderId.trim()) {
      const order = db.get("SELECT * FROM orders WHERE LOWER(id) = LOWER(?)", [orderId.trim()]);
      if (order) {
        orders.push(order);
      }
    } else if (phone && phone.trim()) {
      orders = db.all("SELECT * FROM orders WHERE phone = ? ORDER BY created_at DESC", [phone.trim()]);
    }

    if (orders.length === 0) {
      return res.status(404).json({ error: 'No orders found matching the provided details. Please check and try again.' });
    }

    // Attach items and parsed status updates
    const enrichedOrders = orders.map(order => {
      const items = db.all("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
      let statusUpdates = [];
      try {
        statusUpdates = JSON.parse(order.status_updates || '[]');
      } catch (e) {
        statusUpdates = [{ status: order.status, timestamp: order.created_at, note: '' }];
      }
      return {
        ...order,
        items,
        status_updates: statusUpdates
      };
    });

    res.json({ success: true, count: enrichedOrders.length, orders: enrichedOrders });
  } catch (err) {
    console.error('Error tracking order:', err);
    res.status(500).json({ error: 'Failed to track order.' });
  }
});

// GET /api/orders - Admin get all orders
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    const db = await getDb();

    let query = "SELECT * FROM orders WHERE 1=1";
    const params = [];

    if (status && status !== 'All') {
      query += " AND status = ?";
      params.push(status);
    }

    if (search && search.trim()) {
      query += " AND (id LIKE ? OR customer_name LIKE ? OR phone LIKE ? OR city LIKE ?)";
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += " ORDER BY created_at DESC";

    const orders = db.all(query, params);

    const fullOrders = orders.map(order => {
      const items = db.all("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
      let statusUpdates = [];
      try {
        statusUpdates = JSON.parse(order.status_updates || '[]');
      } catch (e) {
        statusUpdates = [];
      }
      return {
        ...order,
        items,
        status_updates: statusUpdates
      };
    });

    res.json({ success: true, count: fullOrders.length, orders: fullOrders });
  } catch (err) {
    console.error('Error getting admin orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// GET /api/orders/:id - Admin get single order details
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const order = db.get("SELECT * FROM orders WHERE id = ?", [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const items = db.all("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
    let statusUpdates = [];
    try {
      statusUpdates = JSON.parse(order.status_updates || '[]');
    } catch (e) {
      statusUpdates = [];
    }

    res.json({
      success: true,
      order: {
        ...order,
        items,
        status_updates: statusUpdates
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order details.' });
  }
});

// PATCH /api/orders/:id/status - Admin update order status & tracking info
router.patch('/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status, courier_name, tracking_number, note } = req.body;
    const db = await getDb();

    const order = db.get("SELECT * FROM orders WHERE id = ?", [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const allowedStatuses = ['Pending', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];
    const newStatus = status || order.status;

    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    let updates = [];
    try {
      updates = JSON.parse(order.status_updates || '[]');
    } catch (e) {
      updates = [];
    }

    const now = new Date().toISOString();
    const defaultNotes = {
      'Pending': 'Order is received and pending confirmation.',
      'Confirmed': 'Order verified and sent to warehouse for dispatch.',
      'Packed': 'Crackers securely packaged with safety protocols.',
      'Out for Delivery': 'Package handed to courier and out for delivery.',
      'Delivered': 'Order safely delivered. Happy Diwali!',
      'Cancelled': 'Order has been cancelled.'
    };

    updates.push({
      status: newStatus,
      timestamp: now,
      note: note ? note.trim() : (defaultNotes[newStatus] || `Status updated to ${newStatus}`)
    });

    const newCourier = courier_name !== undefined ? courier_name.trim() : order.courier_name;
    const newTrackingNum = tracking_number !== undefined ? tracking_number.trim() : order.tracking_number;

    db.run(`
      UPDATE orders SET
        status = ?,
        courier_name = ?,
        tracking_number = ?,
        status_updates = ?
      WHERE id = ?
    `, [newStatus, newCourier, newTrackingNum, JSON.stringify(updates), req.params.id]);

    db.save();

    res.json({
      success: true,
      message: `Order status updated to ${newStatus}`,
      orderId: req.params.id,
      status: newStatus,
      status_updates: updates
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

module.exports = router;
