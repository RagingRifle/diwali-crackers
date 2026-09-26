const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

// GET /api/settings - Public endpoint to retrieve site settings (e.g. announcement bar)
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const rows = db.all("SELECT key, value FROM settings");
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });

    // Ensure fallback for top_announcement_bar if empty
    if (!settings.top_announcement_bar) {
      settings.top_announcement_bar = '✨ Sivakasi Fresh Quality Crackers • Diwali 2026 Festive Sale • 🚀 Express Doorstep Dispatch & Real-Time Tracking';
    }

    res.json({ success: true, settings });
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Admin protected endpoint to update site settings
router.put('/', authenticateAdmin, async (req, res) => {
  try {
    const { top_announcement_bar, settings: bulkSettings } = req.body;
    const db = await getDb();

    if (top_announcement_bar !== undefined) {
      db.run(
        "INSERT INTO settings (key, value, updated_at) VALUES ('top_announcement_bar', ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        [String(top_announcement_bar).trim()]
      );
    }

    if (bulkSettings && typeof bulkSettings === 'object') {
      for (const [k, v] of Object.entries(bulkSettings)) {
        db.run(
          "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
          [String(k).trim(), String(v).trim()]
        );
      }
    }

    // Return all updated settings
    const rows = db.all("SELECT key, value FROM settings");
    const updated = {};
    rows.forEach(row => {
      updated[row.key] = row.value;
    });

    res.json({ success: true, settings: updated });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
