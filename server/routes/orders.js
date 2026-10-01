const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const { evaluatePromo } = require('../utils/promocodes');
const { sendOrderEmail } = require('../utils/orderEmail');

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
      items,
      promo_code
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
      const mrp = parseFloat(item.mrp) || price;
      const subtotal = price * qty;
      totalAmount += subtotal;

      validatedItems.push({
        product_id: item.id || null,
        product_code: item.code || item.product_code || '',
        product_name: item.name || item.product_name || 'Cracker Item',
        content: item.content || item.pack_size || '',
        mrp,
        price,
        quantity: qty,
        subtotal
      });
    }

    let promoDiscount = 0;
    let appliedPromoCode = '';
    if (promo_code) {
      const promo = db.get('SELECT * FROM promo_codes WHERE code = ? AND active = 1', [String(promo_code).trim().toUpperCase()]);
      const evaluation = promo && evaluatePromo(promo, totalAmount);
      if (!evaluation) {
        return res.status(400).json({ error: 'This promo code is no longer valid for the current cart total.' });
      }
      promoDiscount = evaluation.discount;
      appliedPromoCode = promo.code;
    }

    // Check minimum order value against the pre-discount cart subtotal.
    const minSetting = db.get("SELECT value FROM settings WHERE key = 'minimum_order_value'");
    const minOrderValue = minSetting ? (parseFloat(minSetting.value) || 3000) : 3000;
    if (totalAmount < minOrderValue) {
      const remaining = Math.ceil(minOrderValue - totalAmount);
      return res.status(400).json({
        error: `Minimum order value is ₹${minOrderValue.toLocaleString('en-IN')}. Please add crackers worth ₹${remaining.toLocaleString('en-IN')} more to place your order.`
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
        notes, total_amount, promo_code, promo_discount, status, courier_name, tracking_number,
        status_updates, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', '', '', ?, ?)
    `, [
      orderId,
      customer_name.trim(),
      phone.trim(),
      email ? email.trim() : '',
      address.trim(),
      city.trim(),
      pincode.trim(),
      notes ? notes.trim() : '',
      Math.max(0, totalAmount - promoDiscount),
      appliedPromoCode,
      promoDiscount,
      initialStatusUpdates,
      now
    ]);

    // Insert order items
    for (const item of validatedItems) {
      db.run(`
        INSERT INTO order_items (order_id, product_id, product_code, product_name, content, mrp, price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId,
        item.product_id,
        item.product_code,
        item.product_name,
        item.content,
        item.mrp,
        item.price,
        item.quantity,
        item.subtotal
      ]);
    }

    if (appliedPromoCode) {
      db.run('UPDATE promo_codes SET redemption_count = redemption_count + 1, updated_at = datetime(\'now\') WHERE code = ?', [appliedPromoCode]);
    }

    db.save();

    const fullOrder = {
      id: orderId,
      customer_name: customer_name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      address: address.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      notes: notes ? notes.trim() : '',
      total_amount: Math.max(0, totalAmount - promoDiscount),
      promo_code: appliedPromoCode,
      promo_discount: promoDiscount,
      status: 'Pending',
      courier_name: '',
      tracking_number: '',
      created_at: now,
      items: validatedItems,
      status_updates: [
        {
          status: 'Pending',
          timestamp: now,
          note: 'Order submitted successfully and received by our festive dispatch team.'
        }
      ]
    };

    // Email happens after the order is saved; SMTP outages must not lose a valid order.
    try {
      await sendOrderEmail(fullOrder);
    } catch (emailErr) {
      console.error(`Failed to email order ${orderId}:`, emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      orderId,
      totalAmount: Math.max(0, totalAmount - promoDiscount),
      customerName: customer_name,
      order: fullOrder
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
      const order = db.get("SELECT * FROM orders WHERE LOWER(id) = LOWER(?) AND COALESCE(is_archived, 0) = 0", [orderId.trim()]);
      if (order) {
        orders.push(order);
      }
    } else if (phone && phone.trim()) {
      orders = db.all("SELECT * FROM orders WHERE phone = ? AND COALESCE(is_archived, 0) = 0 ORDER BY created_at DESC", [phone.trim()]);
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
    const { status, search, archived } = req.query;
    const db = await getDb();

    const archiveFilter = archived === 'true' ? 1 : 0;
    let query = "SELECT * FROM orders WHERE COALESCE(is_archived, 0) = ?";
    const params = [archiveFilter];

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
    const order = db.get("SELECT * FROM orders WHERE id = ? AND COALESCE(is_archived, 0) = 0", [req.params.id]);
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

// DELETE /api/orders/:id - Soft-archive an order after an exact-ID confirmation.
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const order = db.get("SELECT id, is_archived FROM orders WHERE id = ?", [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (Number(order.is_archived) === 1) return res.status(409).json({ error: 'This order is already archived.' });
    if (req.body?.confirmation !== order.id) {
      return res.status(400).json({ error: 'Enter the exact order ID to confirm archiving.' });
    }

    const archivedAt = new Date().toISOString();
    const archivedBy = req.admin?.username || req.admin?.sub || 'admin';
    db.run('UPDATE orders SET is_archived = 1, archived_at = ?, archived_by = ? WHERE id = ?', [archivedAt, archivedBy, order.id]);
    db.save();
    res.json({ success: true, message: 'Order archived and can be restored.', orderId: order.id, archivedAt });
  } catch (err) {
    console.error('Error archiving order:', err);
    res.status(500).json({ error: 'Failed to archive order.' });
  }
});

// POST /api/orders/:id/restore - Return an archived order to active records.
router.post('/:id/restore', authenticateAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const order = db.get("SELECT id, is_archived FROM orders WHERE id = ?", [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (Number(order.is_archived) !== 1) return res.status(409).json({ error: 'This order is not archived.' });

    db.run('UPDATE orders SET is_archived = 0 WHERE id = ?', [order.id]);
    db.save();
    res.json({ success: true, message: 'Order restored to active records.', orderId: order.id });
  } catch (err) {
    console.error('Error restoring order:', err);
    res.status(500).json({ error: 'Failed to restore order.' });
  }
});

// PATCH /api/orders/:id/status - Admin update order status & tracking info
router.patch('/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status, courier_name, tracking_number, note } = req.body;
    const db = await getDb();

    const order = db.get("SELECT * FROM orders WHERE id = ? AND COALESCE(is_archived, 0) = 0", [req.params.id]);
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
