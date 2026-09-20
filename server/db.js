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
  // Create tables
  db.rawDb.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT DEFAULT '1 Box',
      price REAL NOT NULL,
      mrp REAL NOT NULL,
      image TEXT DEFAULT '',
      description TEXT DEFAULT '',
      pack_size TEXT DEFAULT '1 Box',
      in_stock INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 0,
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
      product_name TEXT NOT NULL,
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
  `);
  db.save();

  // Check admin
  const admin = db.get("SELECT * FROM admins WHERE username = ?", ['admin']);
  if (!admin) {
    const hash = bcrypt.hashSync('diwali@2026', 10);
    db.run("INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)", ['admin', hash, 'admin']);
    console.log('Seeded default admin user: admin / diwali@2026');
  }

  // Always re-seed from CSV to keep products fresh
  const productCount = db.get("SELECT COUNT(*) as count FROM products");
  if (!productCount || productCount.count === 0) {
    seedProductsFromCSV(db);
  }
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
    // PCS counts → garland crackers
    if (content === 'PCS') return 'Garland Crackers';
    return 'Sound Crackers';
  }
  if (n.includes('SHOT') || n.includes('PEACOCK') && n.includes('MULTI')) {
    return 'Aerial Shots';
  }
  if (n.includes('ROCKET') || n.includes('BOMB') && !n.includes('HYDRO')) {
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
  const header = lines[0];
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Parse quoted CSV fields
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

  // Columns: Category, Code, Product Name, Content, Actual Price, Price
  let inserted = 0;
  for (const row of rows) {
    if (row.length < 6) continue;

    const code = row[1].trim();
    const name = row[2].trim();
    const content = row[3].trim();
    const mrp = parseFloat(row[4]) || 0;
    const price = parseFloat(row[5]) || 0;

    if (!name || !code) continue;

    const category = assignCategory(name, content);

    db.run(`
      INSERT INTO products (code, name, category, content, price, mrp, image, description, pack_size, in_stock, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
    `, [
      code,
      name,
      category,
      content,
      price,
      mrp,
      '', // blank - will be matched via /products/{code}.jpg when available
      '',
      content
    ]);
    inserted++;
  }

  db.save();
  console.log(`Seeded ${inserted} products from CSV successfully.`);
}

module.exports = { getDb };
