const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const { evaluatePromo } = require('../utils/promocodes');

function normalizePromo(body) {
  const code = String(body.code || '').trim().toUpperCase();
  const discount_type = body.discount_type === 'percentage' ? 'percentage' : 'amount';
  const discount_value = Number(body.discount_value);
  let tiers = body.tiers;
  if (!Array.isArray(tiers)) tiers = [];
  tiers = tiers.map(({ min, max, discount }) => ({ min: Number(min), max: Number(max), discount: Number(discount) }));

  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) throw new Error('Use 3–32 letters, numbers, hyphens, or underscores for the code.');
  if (!Number.isFinite(discount_value) || discount_value < 0 || (discount_type === 'percentage' && discount_value > 100)) {
    throw new Error(discount_type === 'percentage' ? 'Percentage must be between 0 and 100.' : 'Enter a valid discount amount.');
  }
  let priorMax = -1;
  for (const tier of tiers) {
    if (!Number.isFinite(tier.min) || !Number.isFinite(tier.max) || !Number.isFinite(tier.discount) || tier.min < 0 || tier.max <= tier.min || tier.discount <= 0) {
      throw new Error('Each range needs a valid minimum, maximum, and positive discount.');
    }
    if (tier.min <= priorMax) throw new Error('Discount ranges must not overlap.');
    if (discount_type === 'percentage' && tier.discount > 100) throw new Error('Range percentages cannot exceed 100%.');
    priorMax = tier.max;
  }
  return { code, discount_type, discount_value, tiers };
}

router.post('/validate', async (req, res) => {
  try {
    const db = await getDb();
    const code = String(req.body.code || '').trim().toUpperCase();
    const cartTotal = Number(req.body.cartTotal);
    if (!Number.isFinite(cartTotal) || cartTotal <= 0) return res.status(400).json({ success: false, error: 'Add items to your cart before applying a promo code.' });
    const promo = db.get('SELECT * FROM promo_codes WHERE code = ? AND active = 1', [code]);
    if (!promo) return res.status(404).json({ success: false, error: 'That promo code is invalid or inactive.' });
    const result = evaluatePromo(promo, cartTotal);
    if (!result) return res.status(400).json({ success: false, error: 'Your cart total does not qualify for this promo code.' });
    res.json({ success: true, code: promo.code, discount: result.discount, cartTotal, total: Math.max(0, cartTotal - result.discount) });
  } catch (err) {
    console.error('Promo validation error:', err);
    res.status(500).json({ success: false, error: 'Could not validate the promo code.' });
  }
});

router.get('/', authenticateAdmin, async (_req, res) => {
  try {
    const db = await getDb();
    res.json({ success: true, promoCodes: db.all('SELECT * FROM promo_codes ORDER BY created_at DESC, id DESC').map(p => ({ ...p, tiers: JSON.parse(p.tiers || '[]') })) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not load promo codes.' });
  }
});

router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const promo = normalizePromo(req.body);
    const db = await getDb();
    db.run('INSERT INTO promo_codes (code, discount_type, discount_value, tiers, active) VALUES (?, ?, ?, ?, ?)', [promo.code, promo.discount_type, promo.discount_value, JSON.stringify(promo.tiers), req.body.active === false ? 0 : 1]);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(err.message?.includes('UNIQUE') ? 409 : 400).json({ success: false, error: err.message || 'Could not create promo code.' });
  }
});

router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const promo = normalizePromo(req.body);
    const db = await getDb();
    const existing = db.get('SELECT id FROM promo_codes WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, error: 'Promo code not found.' });
    db.run('UPDATE promo_codes SET code = ?, discount_type = ?, discount_value = ?, tiers = ?, active = ?, updated_at = datetime(\'now\') WHERE id = ?', [promo.code, promo.discount_type, promo.discount_value, JSON.stringify(promo.tiers), req.body.active === false ? 0 : 1, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(err.message?.includes('UNIQUE') ? 409 : 400).json({ success: false, error: err.message || 'Could not update promo code.' });
  }
});

router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const db = await getDb();
    db.run('DELETE FROM promo_codes WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not delete promo code.' });
  }
});

module.exports = router;
