const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'diwali.db');
const CSV_FILE = path.join(__dirname, '../Products.csv');

let dbInstance = null;

async function getDb() {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();
  let db;

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  function save() {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_FILE, buffer);
    } catch (err) {
      console.error('Error saving SQLite database to disk:', err);
    }
  }

  // Wrapper for easy query execution
  const dbWrapper = {
    rawDb: db,
    save,
    run(sql, params = []) {
      db.run(sql, params);
      save();
      const res = db.exec("SELECT last_insert_rowid() as id");
      const lastId = res[0] && res[0].values[0] ? res[0].values[0][0] : null;
      return { lastInsertRowid: lastId };
    },
    all(sql, params = []) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },
    get(sql, params = []) {
      const results = this.all(sql, params);
      return results.length > 0 ? results[0] : null;
    }
  };

  initTables(dbWrapper);
  dbInstance = dbWrapper;
  return dbInstance;
}

function initTables(db) {
  // Create base tables if they do not exist
  db.rawDb.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT DEFAULT '1 Box',
      price REAL NOT NULL,
      mrp REAL NOT NULL,
      discount_percent REAL DEFAULT 0,
      image TEXT DEFAULT '',
      description TEXT DEFAULT '',
      pack_size TEXT DEFAULT '1 Box',
      in_stock INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 0,
      is_combo INTEGER DEFAULT 0,
      combo_items TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      pincode TEXT NOT NULL,
      notes TEXT,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'Pending',
      courier_name TEXT DEFAULT '',
      tracking_number TEXT DEFAULT '',
      status_updates TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id INTEGER,
      product_code TEXT DEFAULT '',
      product_name TEXT NOT NULL,
      content TEXT DEFAULT '',
      mrp REAL DEFAULT 0,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id)
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin'
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.save();

  // Seed default settings if not exists
  try {
    const topBar = db.get("SELECT * FROM settings WHERE key = ?", ['top_announcement_bar']);
    if (!topBar) {
      db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [
        'top_announcement_bar',
        '✨ Sivakasi Fresh Quality Crackers • Diwali 2026 Festive Sale • 🚀 Express Doorstep Dispatch & Real-Time Tracking'
      ]);
      console.log('Seeded default announcement bar setting');
    }
  } catch (e) {
    console.error('Error seeding settings:', e.message);
  }

  // Migrations for existing databases
  try {
    const productCols = db.all("PRAGMA table_info(products)").map(c => c.name);
    if (!productCols.includes('is_combo')) {
      db.rawDb.run("ALTER TABLE products ADD COLUMN is_combo INTEGER DEFAULT 0");
    }
    if (!productCols.includes('combo_items')) {
      db.rawDb.run("ALTER TABLE products ADD COLUMN combo_items TEXT DEFAULT ''");
    }
    if (!productCols.includes('discount_percent')) {
      db.rawDb.run("ALTER TABLE products ADD COLUMN discount_percent REAL DEFAULT 0");
    }

    const orderItemCols = db.all("PRAGMA table_info(order_items)").map(c => c.name);
    if (!orderItemCols.includes('product_code')) {
      db.rawDb.run("ALTER TABLE order_items ADD COLUMN product_code TEXT DEFAULT ''");
    }
    if (!orderItemCols.includes('content')) {
      db.rawDb.run("ALTER TABLE order_items ADD COLUMN content TEXT DEFAULT ''");
    }
    if (!orderItemCols.includes('mrp')) {
      db.rawDb.run("ALTER TABLE order_items ADD COLUMN mrp REAL DEFAULT 0");
    }
    db.save();
  } catch (mErr) {
    console.log('Migration note:', mErr.message);
  }

  // Update discount_percent where 0
  try {
    db.rawDb.run(`
      UPDATE products 
      SET discount_percent = ROUND(((mrp - price) * 100.0) / mrp)
      WHERE mrp > price AND (discount_percent IS NULL OR discount_percent = 0)
    `);
    db.save();
  } catch (e) {}

  // Check admin
  const admin = db.get("SELECT * FROM admins WHERE username = ?", ['admin']);
  if (!admin) {
    const hash = bcrypt.hashSync('diwali@2026', 10);
    db.run("INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)", ['admin', hash, 'admin']);
    console.log('Seeded default admin user: admin / diwali@2026');
  }

  // Check products count
  const productCount = db.get("SELECT COUNT(*) as count FROM products");
  if (!productCount || productCount.count === 0) {
    seedProductsFromCSV(db);
  }

  // Seed default combo bundles if none exist
  seedCombosIfEmpty(db);
}

// ─── Category mapping ────────────────────────────────────────────────────────
function assignCategory(name, content) {
  const n = name.toUpperCase();

  if (/\bCM\b.*ELECTRIC|CM.*CRACL|CM.*SPARKLING|CM.*SUPREME/.test(n) ||
      n.includes('SPARKLER') || n.includes('TWINKLING STAR') ||
      /^\d+\s*CM\b/.test(n)) {
    return 'Sparklers';
  }
  if (n.includes('FLOWER POT') || n.includes('COLOURKOTI') ||
      n.includes('TRICOLOUR') || n.includes('TRI COLOUR')) {
    return 'Flowerpots';
  }
  if (n.includes('CHAKKAR') || n.includes('4X4 WHEEL') ||
      n.includes('WIRE CHAKKAR') || n.includes('WIRECHAKKAR') ||
      n.includes('PIN WHEEL')) {
    return 'Ground Chakkars';
  }
  if (n.includes('HYDRO BOMB') || n.includes('MARSAL')) {
    return 'Bombs';
  }
  if (n.includes('LAKSHMI') || n.includes('BIJILLI') ||
      n.includes('KURUVI') || n.includes('RED BIJILLI') ||
      n.includes('100') || n.includes('200') || n.includes('1000') ||
      n.includes('2000') || n.includes('5000')) {
    if (content === 'PCS') return 'Garland Crackers';
    return 'Sound Crackers';
  }
  if (n.includes('SHOT') || (n.includes('PEACOCK') && n.includes('MULTI'))) {
    return 'Aerial Shots';
  }
  if (n.includes('ROCKET') || (n.includes('BOMB') && !n.includes('HYDRO'))) {
    return 'Rockets';
  }
  if (n.includes('HOLI') || n.includes('KINDER JOY') ||
      n.includes('LOLLI') || n.includes('LOLLIPOP')) {
    return 'Novelty Items';
  }
  if (n.includes('PHOTO FLASH') || n.includes('COLOUR SMOKE') ||
      n.includes('SIREN') || n.includes('SMOKE')) {
    return 'Novelty Items';
  }
  if (n.includes('BUTTERFLY') || n.includes('HELICOPTER') ||
      n.includes('HAMMER') || n.includes('BAT') ||
      n.includes('LEO') || n.includes('DANDIYA') ||
      n.includes('HUNTER') || n.includes('BRAVE') ||
      n.includes('RUN') || n.includes('FOOT') ||
      n.includes('CRICKET') || n.includes('CYCLING') ||
      n.includes('WARRIOR') || n.includes('BOSS') ||
      n.includes('CHICAGO') || n.includes('GRAND MASTER') ||
      n.includes('GRAND GANGSTAR') || n.includes('ROCK GAKI') ||
      n.includes('BEAUTY QUEEN') || n.includes('SOCIAL MEDIA') ||
      n.includes('HERO ACADEMIA') || n.includes('MINECRAFT') ||
      n.includes('HIDEN SAFARI') || n.includes('WIRE CHAKKAR')) {
    return 'Fancy Novelties';
  }
  if (n.includes('TIN') || n.includes('PEACOCK FEATHER') ||
      n.includes('SILVER STAR') || n.includes('ROCK STAR') ||
      n.includes('GOLDEN PEACOCK') || n.includes('CANDY') ||
      n.includes('HIGH VOLTAG') || n.includes('POPPIN') ||
      n.includes('BLUE ICE') || n.includes('GOLD FISH') ||
      n.includes('HI - SONA') || n.includes('POWER POT') ||
      n.includes('BINGO') || n.includes('KURKURE') ||
      n.includes('TANGLES') || n.includes('LAYS') ||
      n.includes('MINIOUS') || n.includes('WATER QUEEN') ||
      n.includes('POP CORN') || n.includes('WELCOME SHOT') ||
      n.includes('WONDER TREE') || n.includes('CRACKLING KING') ||
      n.includes('MAGIC BUTTERFLY') || n.includes('TITANIC') ||
      n.includes('MINI PEARL') || n.includes('TIM TIM') ||
      n.includes('CEACKLING') || n.includes('HAND SHOTS') ||
      n.includes('CHHOTA') || n.includes('LOLLI POP FOUNTAIN')) {
    return 'Fancy Fountains';
  }
  if (n.includes('FANTASY ISLAND') || n.includes('FIFTY FIFTY') ||
      n.includes('CARNIVAL') || n.includes('NEW MOON') ||
      n.includes('VENICE') || n.includes('PARIS') ||
      n.includes('TOKYO') || n.includes('MIAMI') ||
      n.includes('LASVEGAS') || n.includes('AMAZE') ||
      n.includes('MONKEY QUEST') || n.includes('ATTACK MODE') ||
      n.includes('NEWYEAR KISS') || n.includes('PEPSI') ||
      n.includes('RED BLUE') || n.includes('COCO COLA') ||
      n.includes('LIMCA') || n.includes('FANTA') ||
      n.includes('7 UP')) {
    return 'Sky Shots';
  }

  return 'Miscellaneous';
}

// ─── Parse Products.csv and insert ────────────────────────────────────────────
function parseCSV(raw) {
  const lines = raw.split('\n').filter(l => l.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const fields = [];
    let inQuote = false;
    let cur = '';
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        fields.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    fields.push(cur.trim());
    rows.push(fields);
  }
  return rows;
}

function seedProductsFromCSV(db) {
  console.log('Seeding products from Products.csv...');

  if (!fs.existsSync(CSV_FILE)) {
    console.warn('Products.csv not found, skipping CSV seeding.');
    return;
  }

  const raw = fs.readFileSync(CSV_FILE, 'utf8');
  const rows = parseCSV(raw);

  let inserted = 0;
  for (const row of rows) {
    if (row.length < 6) continue;

    const code = row[1].trim();
    const name = row[2].trim();
    const content = row[3].trim();
    const mrp = parseFloat(row[4]) || 0;
    const price = parseFloat(row[5]) || 0;
    const discount_percent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

    if (!name || !code) continue;

    const category = assignCategory(name, content);

    db.run(`
      INSERT INTO products (code, name, category, content, price, mrp, discount_percent, image, description, pack_size, in_stock, featured, is_combo, combo_items)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, '')
    `, [
      code,
      name,
      category,
      content,
      price,
      mrp,
      discount_percent,
      '',
      '',
      content
    ]);
    inserted++;
  }

  db.save();
  console.log(`Seeded ${inserted} products from CSV successfully.`);
}

function seedCombosIfEmpty(db) {
  const existingCombos = db.get("SELECT COUNT(*) as count FROM products WHERE is_combo = 1");
  if (existingCombos && existingCombos.count > 0) return;

  console.log('Seeding sample Combo Bundles...');

  // Combo 1: Family Dhamaka Celebration Box
  const combo1Items = [
    { code: '5', name: '10 CM ELECTRIC', content: 'BOX', quantity: 2, mrp: 110, price: 17 },
    { code: '23', name: 'FLOWER POTS BIG', content: 'BOX', quantity: 1, mrp: 360, price: 54 },
    { code: '30', name: 'GROUND CHAKKAR SPECIAL', content: 'BOX', quantity: 1, mrp: 320, price: 48 },
    { code: '39', name: '2 3/4 KURUVI CRACKERS', content: 'PKT', quantity: 2, mrp: 53, price: 8 },
    { code: '218', name: '12 SHOTS ( MULTI COLOUR CRACKLING )', content: 'BOX', quantity: 1, mrp: 1100, price: 165 }
  ];
  const combo1Mrp = 110 * 2 + 360 + 320 + 53 * 2 + 1100; // 2106
  const combo1Price = 280; // Special bundle deal
  const combo1Discount = Math.round(((combo1Mrp - combo1Price) / combo1Mrp) * 100);

  // Combo 2: Kids Joy Sparkling Hamper
  const combo2Items = [
    { code: '8', name: '10 CM SPARKLING RED', content: 'BOX', quantity: 2, mrp: 140, price: 21 },
    { code: '7', name: '10 CM SUPREME GREEN', content: 'BOX', quantity: 2, mrp: 130, price: 20 },
    { code: '74', name: 'KINDER JOY RED', content: 'BOX', quantity: 1, mrp: 480, price: 72 },
    { code: '144', name: 'BUTTER FLY', content: 'BOX', quantity: 1, mrp: 550, price: 83 },
    { code: '302', name: 'LOLLI POP FOUNTAIN', content: 'BOX', quantity: 1, mrp: 490, price: 74 }
  ];
  const combo2Mrp = 140 * 2 + 130 * 2 + 480 + 550 + 490; // 2060
  const combo2Price = 260;
  const combo2Discount = Math.round(((combo2Mrp - combo2Price) / combo2Mrp) * 100);

  // Combo 3: Royal Sky Symphony Mega Pack
  const combo3Items = [
    { code: '218', name: '12 SHOTS ( MULTI COLOUR CRACKLING )', content: 'BOX', quantity: 1, mrp: 1100, price: 165 },
    { code: '220', name: '30 SHOTS ( MULTI COLOUR CRACKLING )', content: 'BOX', quantity: 1, mrp: 2500, price: 375 },
    { code: '119', name: 'GRAND MASTER', content: '1pcs', quantity: 1, mrp: 1600, price: 240 },
    { code: '65', name: 'WHISHLING ROCKET', content: 'BOX', quantity: 1, mrp: 1000, price: 150 },
    { code: '366', name: 'PEACOCK BATA ( MULTI COLOUR CRACKLING )', content: '1pcs', quantity: 1, mrp: 2400, price: 360 }
  ];
  const combo3Mrp = 1100 + 2500 + 1600 + 1000 + 2400; // 8600
  const combo3Price = 1150;
  const combo3Discount = Math.round(((combo3Mrp - combo3Price) / combo3Mrp) * 100);

  const sampleCombos = [
    {
      code: 'CB-101',
      name: 'Family Dhamaka Celebration Hamper (7 Packs)',
      category: 'Combo Bundles',
      content: '7 Items Hamper',
      mrp: combo1Mrp,
      price: combo1Price,
      discount_percent: combo1Discount,
      combo_items: JSON.stringify(combo1Items),
      description: 'The ultimate family pack: 2x Sparklers, Flower Pots, Chakkars, 2x Kuruvi Crackers & 12 Shots Sky Cake.',
      image: '',
      featured: 1
    },
    {
      code: 'CB-102',
      name: 'Kids Sparkler & Fountain Magic Box (7 Packs)',
      category: 'Combo Bundles',
      content: '7 Items Hamper',
      mrp: combo2Mrp,
      price: combo2Price,
      discount_percent: combo2Discount,
      combo_items: JSON.stringify(combo2Items),
      description: 'Child-safe colourful festive box with Red & Green Sparklers, Kinder Joy, Flying Butterfly and Lollipop Fountain.',
      image: '',
      featured: 1
    },
    {
      code: 'CB-103',
      name: 'Royal Sivakasi Sky Show Hamper (5 Mega Fireworks)',
      category: 'Combo Bundles',
      content: '5 Mega Fireworks',
      mrp: combo3Mrp,
      price: combo3Price,
      discount_percent: combo3Discount,
      combo_items: JSON.stringify(combo3Items),
      description: 'Spectacular night sky aerial display with 12 Shots, 30 Shots Cake, Grand Master Aerial Shell, Whistling Rockets & Peacock Bata.',
      image: '',
      featured: 1
    }
  ];

  for (const c of sampleCombos) {
    db.run(`
      INSERT INTO products (code, name, category, content, price, mrp, discount_percent, image, description, pack_size, in_stock, featured, is_combo, combo_items)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, ?)
    `, [
      c.code,
      c.name,
      c.category,
      c.content,
      c.price,
      c.mrp,
      c.discount_percent,
      c.image,
      c.description,
      c.content,
      c.featured,
      c.combo_items
    ]);
  }

  db.save();
  console.log(`Seeded ${sampleCombos.length} sample combo bundles successfully.`);
}

module.exports = { getDb };
