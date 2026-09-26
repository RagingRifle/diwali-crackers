const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

// GET /api/products - list all products with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, search, featured, inStockOnly, isCombo } = req.query;
    const db = await getDb();

    let query = "SELECT * FROM products WHERE 1=1";
    const params = [];

    if (category && category !== 'All') {
      query += " AND category = ?";
      params.push(category);
    }

    if (isCombo !== undefined) {
      query += " AND is_combo = ?";
      params.push(isCombo === 'true' || isCombo === '1' ? 1 : 0);
    }

    if (search && search.trim()) {
      query += " AND (name LIKE ? OR description LIKE ? OR code LIKE ?)";
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (featured === 'true' || featured === '1') {
      query += " AND featured = 1";
    }

    if (inStockOnly === 'true') {
      query += " AND in_stock = 1";
    }

    // Combos first or sorted by category and code
    query += " ORDER BY is_combo DESC, category ASC, CAST(code AS INTEGER) ASC";

    const products = db.all(query, params);
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// GET /api/products/categories - list distinct categories with counts
router.get('/categories', async (req, res) => {
  try {
    const db = await getDb();
    const rows = db.all(`
      SELECT category, COUNT(*) as count
      FROM products
      WHERE in_stock = 1
      GROUP BY category
      ORDER BY (CASE WHEN category = 'Combo Bundles' THEN 0 ELSE 1 END), category ASC
    `);
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    res.json({
      success: true,
      categories: rows,
      total
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// GET /api/products/:id - single product
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const product = db.get("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
});

// POST /api/products - Admin create product (Regular or Combo)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const {
      code, name, category, content, price, mrp, discount_percent,
      image, description, pack_size, in_stock, featured, is_combo, combo_items, buying_cost
    } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: 'Name, category, and price are required.' });
    }

    const numPrice = Number(price) || 0;
    const numMrp = Number(mrp) || numPrice;
    const numDiscount = discount_percent !== undefined
      ? Number(discount_percent)
      : (numMrp > numPrice ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0);
    const numBuyingCost = Number(buying_cost) || 0;

    const isComboVal = is_combo ? 1 : (category === 'Combo Bundles' ? 1 : 0);
    const comboItemsStr = typeof combo_items === 'object' ? JSON.stringify(combo_items) : (combo_items || '');

    const db = await getDb();
    // Migration safety: add column if it doesn't exist
    try { db.run("ALTER TABLE products ADD COLUMN buying_cost REAL DEFAULT 0"); } catch(e) {}

    const result = db.run(`
      INSERT INTO products (
        code, name, category, content, price, mrp, discount_percent,
        image, description, pack_size, in_stock, featured, is_combo, combo_items, buying_cost
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code ? String(code).trim() : null,
      name.trim(),
      category.trim(),
      content ? String(content).trim() : (pack_size || '1 Box'),
      numPrice,
      numMrp,
      numDiscount,
      image ? String(image).trim() : '',
      description ? String(description).trim() : '',
      pack_size ? String(pack_size).trim() : (content || '1 Box'),
      in_stock === undefined ? 1 : (in_stock ? 1 : 0),
      featured ? 1 : 0,
      isComboVal,
      comboItemsStr,
      numBuyingCost
    ]);

    const createdProduct = db.get("SELECT * FROM products WHERE id = ?", [result.lastInsertRowid]);
    res.status(201).json({ success: true, product: createdProduct });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

// PUT /api/products/:id - Admin update product or combo
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const {
      code, name, category, content, price, mrp, discount_percent,
      image, description, pack_size, in_stock, featured, is_combo, combo_items, buying_cost
    } = req.body;
    const db = await getDb();

    // Migration safety
    try { db.run("ALTER TABLE products ADD COLUMN buying_cost REAL DEFAULT 0"); } catch(e) {}

    const existing = db.get("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const numPrice = price !== undefined ? Number(price) : existing.price;
    const numMrp = mrp !== undefined ? Number(mrp) : existing.mrp;
    const numDiscount = discount_percent !== undefined
      ? Number(discount_percent)
      : (numMrp > numPrice ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0);
    const numBuyingCost = buying_cost !== undefined ? Number(buying_cost) : (existing.buying_cost || 0);

    const isComboVal = is_combo !== undefined
      ? (is_combo ? 1 : 0)
      : (category === 'Combo Bundles' ? 1 : existing.is_combo);

    const comboItemsStr = combo_items !== undefined
      ? (typeof combo_items === 'object' ? JSON.stringify(combo_items) : String(combo_items))
      : existing.combo_items;

    db.run(`
      UPDATE products SET
        code = ?,
        name = ?,
        category = ?,
        content = ?,
        price = ?,
        mrp = ?,
        discount_percent = ?,
        image = ?,
        description = ?,
        pack_size = ?,
        in_stock = ?,
        featured = ?,
        is_combo = ?,
        combo_items = ?,
        buying_cost = ?
      WHERE id = ?
    `, [
      code !== undefined ? String(code) : existing.code,
      name !== undefined ? name.trim() : existing.name,
      category !== undefined ? category.trim() : existing.category,
      content !== undefined ? content.trim() : existing.content,
      numPrice,
      numMrp,
      numDiscount,
      image !== undefined ? image.trim() : existing.image,
      description !== undefined ? description.trim() : existing.description,
      pack_size !== undefined ? pack_size.trim() : existing.pack_size,
      in_stock !== undefined ? (in_stock ? 1 : 0) : existing.in_stock,
      featured !== undefined ? (featured ? 1 : 0) : existing.featured,
      isComboVal,
      comboItemsStr,
      numBuyingCost,
      req.params.id
    ]);

    const updated = db.get("SELECT * FROM products WHERE id = ?", [req.params.id]);
    res.json({ success: true, product: updated });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// PATCH /api/products/:id/discount - Admin change discount manually (product or combo)
router.patch('/:id/discount', authenticateAdmin, async (req, res) => {
  try {
    const { discount_percent, price } = req.body;
    const db = await getDb();

    const existing = db.get("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    let finalPrice = existing.price;
    let finalDiscount = existing.discount_percent;

    if (discount_percent !== undefined) {
      const disc = Math.max(0, Math.min(99, Number(discount_percent)));
      finalDiscount = disc;
      finalPrice = Math.max(1, Math.round(existing.mrp * (1 - disc / 100)));
    } else if (price !== undefined) {
      finalPrice = Math.max(1, Number(price));
      finalDiscount = existing.mrp > finalPrice
        ? Math.round(((existing.mrp - finalPrice) / existing.mrp) * 100)
        : 0;
    }

    db.run(`
      UPDATE products SET
        price = ?,
        discount_percent = ?
      WHERE id = ?
    `, [finalPrice, finalDiscount, req.params.id]);

    const updated = db.get("SELECT * FROM products WHERE id = ?", [req.params.id]);
    res.json({ success: true, product: updated });
  } catch (err) {
    console.error('Error updating discount:', err);
    res.status(500).json({ error: 'Failed to update discount.' });
  }
});

// POST /api/products/bulk-discount - Admin apply manual discount to category or combos
router.post('/bulk-discount', authenticateAdmin, async (req, res) => {
  try {
    const { category, discount_percent, is_combo } = req.body;
    if (discount_percent === undefined || isNaN(discount_percent)) {
      return res.status(400).json({ error: 'Valid discount percentage is required.' });
    }

    const disc = Math.max(0, Math.min(99, Number(discount_percent)));
    const db = await getDb();

    let query = "SELECT id, mrp FROM products WHERE mrp > 0";
    const params = [];

    if (is_combo !== undefined) {
      query += " AND is_combo = ?";
      params.push(is_combo ? 1 : 0);
    }

    if (category && category !== 'All') {
      query += " AND category = ?";
      params.push(category);
    }

    const targetProducts = db.all(query, params);
    let count = 0;

    for (const prod of targetProducts) {
      const newPrice = Math.max(1, Math.round(prod.mrp * (1 - disc / 100)));
      db.run("UPDATE products SET price = ?, discount_percent = ? WHERE id = ?", [newPrice, disc, prod.id]);
      count++;
    }

    db.save();
    res.json({ success: true, updatedCount: count, discountApplied: disc });
  } catch (err) {
    console.error('Error applying bulk discount:', err);
    res.status(500).json({ error: 'Failed to apply bulk discount.' });
  }
});

// DELETE /api/products/:id - Admin delete product
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const existing = db.get("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    db.run("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

// PATCH /api/products/:id/toggle-stock - Admin quick toggle stock
router.patch('/:id/toggle-stock', authenticateAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const existing = db.get("SELECT in_stock FROM products WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const newStock = existing.in_stock ? 0 : 1;
    db.run("UPDATE products SET in_stock = ? WHERE id = ?", [newStock, req.params.id]);
    res.json({ success: true, in_stock: newStock });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle stock status.' });
  }
});

module.exports = router;
