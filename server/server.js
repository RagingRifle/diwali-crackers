const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/settings', require('./routes/settings'));

// Static files (built client)
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Diwali Crackers E-Commerce API',
    time: new Date().toISOString()
  });
});

// Admin panel — serve admin.html for /admin and /admin/*
app.get('/admin', (req, res) => {
  res.sendFile(path.join(clientDist, 'admin.html'));
});
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(clientDist, 'admin.html'));
});

// Customer SPA fallback (exclude /api and /admin)
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  if (req.url.startsWith('/admin')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Start Server & verify DB
async function startServer() {
  try {
    const db = await getDb();
    console.log('✅ SQLite database initialized successfully.');

    app.listen(PORT, () => {
      console.log(`🚀 Diwali Crackers Server listening at http://localhost:${PORT}`);
      console.log(`✨ Admin credentials -> Username: admin | Password: diwali@2026`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
