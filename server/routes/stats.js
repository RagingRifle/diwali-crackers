const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

// GET /api/stats - Admin dashboard metrics
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const db = await getDb();

    // Total orders
    const totalOrdersRes = db.get("SELECT COUNT(*) as count FROM orders");
    const totalOrders = totalOrdersRes ? totalOrdersRes.count : 0;

    // Total revenue
    const revenueRes = db.get("SELECT SUM(total_amount) as total FROM orders WHERE status != 'Cancelled'");
    const totalRevenue = revenueRes && revenueRes.total ? revenueRes.total : 0;

    // Status breakdown
    const pendingRes = db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'Pending'");
    const confirmedRes = db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'Confirmed'");
    const packedRes = db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'Packed'");
    const outForDeliveryRes = db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'Out for Delivery'");
    const deliveredRes = db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'Delivered'");
    const cancelledRes = db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'Cancelled'");

    // Total products
    const totalProductsRes = db.get("SELECT COUNT(*) as count FROM products");
    const inStockRes = db.get("SELECT COUNT(*) as count FROM products WHERE in_stock = 1");

    // Recent 5 orders
    const recentOrders = db.all("SELECT id, customer_name, phone, city, total_amount, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5");

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue,
        pendingOrders: pendingRes ? pendingRes.count : 0,
        confirmedOrders: confirmedRes ? confirmedRes.count : 0,
        packedOrders: packedRes ? packedRes.count : 0,
        outForDeliveryOrders: outForDeliveryRes ? outForDeliveryRes.count : 0,
        inTransitOrders: (packedRes ? packedRes.count : 0) + (outForDeliveryRes ? outForDeliveryRes.count : 0),
        deliveredOrders: deliveredRes ? deliveredRes.count : 0,
        cancelledOrders: cancelledRes ? cancelledRes.count : 0,
        totalProducts: totalProductsRes ? totalProductsRes.count : 0,
        inStockProducts: inStockRes ? inStockRes.count : 0
      },
      recentOrders
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics.' });
  }
});

module.exports = router;
