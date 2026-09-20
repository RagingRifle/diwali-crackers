const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

// GET /api/products - list all products with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, search, featured, inStockOnly } = req.query;
    const db = await getDb();

    let query = "SELECT * FROM products WHERE 1=1";
    const params = [];

    if (category && category !== 'All') {
      query += " AND category = ?";
      params.push(category);
    }

    if (search && search.trim()) {
      query += " AND (name LIKE ? OR description LIKE ?)";
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (featured === 'true' || featured === '1') {
      query += " AND featured = 1";
    }

    if (inStockOnly === 'true') {
      query += " AND in_stock = 1";
    }

    query += " ORDER BY id DESC";

    const products = db.all(query, params);
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// GET /api/products/categories - list distinct categories
router.get('/categories', async (req, res) => {
  try {
    const db = await getDb();
    const rows = db.all("SELECT DISTINCT category FROM products ORDER BY category ASC");
    const categories = rows.map(r => r.category);
    res.json({ success: true, categories });
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

// POST /api/products - Admin create product
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, category, price, mrp, image, description, pack_size, in_stock, featured } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: 'Name, category, and price are required.' });
    }

    const db = await getDb();
    const result = db.run(`
      INSERT INTO products (name, category, price, mrp, image, description, pack_size, in_stock, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      category.trim(),
      Number(price) || 0,
      Number(mrp) || Number(price) || 0,
      image ? image.trim() : 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=500&auto=format&fit=crop&q=60',
      description ? description.trim() : '',
      pack_size ? pack_size.trim() : '1 Box',
      in_stock === undefined ? 1 : (in_stock ? 1 : 0),
      featured ? 1 : 0
    ]);

    const createdProduct = db.get("SELECT * FROM products WHERE id = ?", [result.lastInsertRowid]);
    res.status(201).json({ success: true, product: createdProduct });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

// PUT /api/products/:id - Admin update product
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, category, price, mrp, image, description, pack_size, in_stock, featured } = req.body;
    const db = await getDb();

    const existing = db.get("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    db.run(`
      UPDATE products SET
        name = ?,
        category = ?,
        price = ?,
        mrp = ?,
        image = ?,
        description = ?,
        pack_size = ?,
        in_stock = ?,
        featured = ?
      WHERE id = ?
    `, [
      name !== undefined ? name.trim() : existing.name,
      category !== undefined ? category.trim() : existing.category,
      price !== undefined ? Number(price) : existing.price,
      mrp !== undefined ? Number(mrp) : existing.mrp,
      image !== undefined ? image.trim() : existing.image,
      description !== undefined ? description.trim() : existing.description,
      pack_size !== undefined ? pack_size.trim() : existing.pack_size,
      in_stock !== undefined ? (in_stock ? 1 : 0) : existing.in_stock,
      featured !== undefined ? (featured ? 1 : 0) : existing.featured,
      req.params.id
    ]);

    const updated = db.get("SELECT * FROM products WHERE id = ?", [req.params.id]);
    res.json({ success: true, product: updated });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product.' });
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
