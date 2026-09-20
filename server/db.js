const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'diwali.db');
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
      // Get last insert ID
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
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      mrp REAL NOT NULL,
      image TEXT NOT NULL,
      description TEXT,
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

  // Check products
  const productCount = db.get("SELECT COUNT(*) as count FROM products");
  if (!productCount || productCount.count === 0) {
    seedProducts(db);
  }
}

function seedProducts(db) {
  console.log('Seeding Diwali Crackers catalog...');
  const sampleProducts = [
    // Sparklers
    {
      name: "10cm Electric Sparklers",
      category: "Sparklers",
      price: 65,
      mrp: 120,
      image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=500&auto=format&fit=crop&q=60",
      description: "Bright silver sparkling sticks, low smoke, safe and fun for children.",
      pack_size: "10 Sticks per box",
      featured: 1
    },
    {
      name: "15cm Green Crackling Sparklers",
      category: "Sparklers",
      price: 110,
      mrp: 190,
      image: "https://images.unsplash.com/photo-1531219432768-9f540ce91ef3?w=500&auto=format&fit=crop&q=60",
      description: "Dazzling emerald green sparkles with rhythmic festive crackling sound.",
      pack_size: "10 Sticks per box",
      featured: 0
    },
    {
      name: "30cm Golden Shower Sparklers",
      category: "Sparklers",
      price: 180,
      mrp: 290,
      image: "https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=500&auto=format&fit=crop&q=60",
      description: "Extra-long duration golden sparks radiating pure Diwali festive cheer.",
      pack_size: "5 Sticks per box",
      featured: 1
    },
    {
      name: "50cm Mega Colour Sparklers",
      category: "Sparklers",
      price: 260,
      mrp: 420,
      image: "https://images.unsplash.com/photo-1508963493744-76fce69379c0?w=500&auto=format&fit=crop&q=60",
      description: "Longest lasting multi-colour sparkling experience with multi-stage glow.",
      pack_size: "5 Sticks per box",
      featured: 0
    },

    // Flower Pots
    {
      name: "Flower Pots Special (Asoka)",
      category: "Flower pots",
      price: 140,
      mrp: 240,
      image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&auto=format&fit=crop&q=60",
      description: "Traditional cone fountains erupting into dense golden silver floral showers.",
      pack_size: "10 Pieces per box",
      featured: 1
    },
    {
      name: "Flower Pots Deluxe (Tri-Colour)",
      category: "Flower pots",
      price: 240,
      mrp: 380,
      image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&auto=format&fit=crop&q=60",
      description: "Tri-stage colour changes: vibrant red, sparkling silver, and bright emerald.",
      pack_size: "10 Pieces per box",
      featured: 1
    },
    {
      name: "Giant Colour Koti Fountain",
      category: "Flower pots",
      price: 320,
      mrp: 500,
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60",
      description: "Super tall 15-feet erupting shower with crackling multi-colour stars.",
      pack_size: "5 Pieces per box",
      featured: 0
    },

    // Ground Chakras
    {
      name: "Ground Chakkar Special",
      category: "Chakras",
      price: 120,
      mrp: 200,
      image: "https://images.unsplash.com/photo-1543258103-a62bdc069871?w=500&auto=format&fit=crop&q=60",
      description: "High speed rotating ground wheel producing an intense circle of fiery sparks.",
      pack_size: "10 Pieces per box",
      featured: 1
    },
    {
      name: "Ground Chakkar Deluxe Big",
      category: "Chakras",
      price: 190,
      mrp: 310,
      image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=60",
      description: "Heavy duration spinning chakra with multi-ring golden light halos.",
      pack_size: "10 Pieces per box",
      featured: 0
    },
    {
      name: "Disco Spinning Wheel (Multi-Colour)",
      category: "Chakras",
      price: 240,
      mrp: 390,
      image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=60",
      description: "Musical whirl with flashing red and green lights as it spins across the floor.",
      pack_size: "5 Pieces per box",
      featured: 0
    },

    // Rockets
    {
      name: "Whistling Sound Rocket",
      category: "Rockets",
      price: 180,
      mrp: 300,
      image: "https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=500&auto=format&fit=crop&q=60",
      description: "High-pitch whistling ascent reaching 100 feet followed by a booming burst.",
      pack_size: "10 Pieces per box",
      featured: 1
    },
    {
      name: "Lunik Sky Rocket",
      category: "Rockets",
      price: 220,
      mrp: 360,
      image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=500&auto=format&fit=crop&q=60",
      description: "Straight line high altitude shooter bursting into silver palm tree canopy.",
      pack_size: "10 Pieces per box",
      featured: 0
    },
    {
      name: "Parachute Floating Rocket",
      category: "Rockets",
      price: 350,
      mrp: 550,
      image: "https://images.unsplash.com/photo-1531219432768-9f540ce91ef3?w=500&auto=format&fit=crop&q=60",
      description: "Ejects a gentle glowing parachute floating slowly back down from the night sky.",
      pack_size: "5 Pieces per box",
      featured: 1
    },

    // Bombs
    {
      name: "Classic Laxmi Crackers 4-Inch",
      category: "Bombs",
      price: 90,
      mrp: 160,
      image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&auto=format&fit=crop&q=60",
      description: "Classic Diwali essential with sharp energetic thunderous sound.",
      pack_size: "5 Bundles",
      featured: 1
    },
    {
      name: "Hydro Bomb (Mega Sound)",
      category: "Bombs",
      price: 195,
      mrp: 320,
      image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&auto=format&fit=crop&q=60",
      description: "Heavy bass concussion sound, green-certified safe Sivakasi formula.",
      pack_size: "10 Pieces per box",
      featured: 1
    },
    {
      name: "Digital 28 Chorsa Crackers Garland",
      category: "Bombs",
      price: 140,
      mrp: 230,
      image: "https://images.unsplash.com/photo-1543258103-a62bdc069871?w=500&auto=format&fit=crop&q=60",
      description: "Continuous rapid-fire crackling string to ward off darkness.",
      pack_size: "1 Garland roll",
      featured: 0
    },

    // Fancy items
    {
      name: "7 Shots Peacock Aerial Fountain",
      category: "Fancy items",
      price: 280,
      mrp: 450,
      image: "https://images.unsplash.com/photo-1508963493744-76fce69379c0?w=500&auto=format&fit=crop&q=60",
      description: "Successive 7 high-altitude bursts of vivid peacock blues, gold, and ruby red.",
      pack_size: "1 Piece",
      featured: 1
    },
    {
      name: "12 Shots Sky High Symphony",
      category: "Fancy items",
      price: 480,
      mrp: 750,
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60",
      description: "Spectacular multi-shot aerial cake painting the night sky in cascading stars.",
      pack_size: "1 Cake Box",
      featured: 1
    },
    {
      name: "Magic Butterfly (Flying Spinner)",
      category: "Fancy items",
      price: 150,
      mrp: 250,
      image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=60",
      description: "Soars 20 feet in circular wings of green and gold light before bursting.",
      pack_size: "10 Pieces per box",
      featured: 0
    },

    // Gift boxes
    {
      name: "Diwali Family Jumbo Gift Box (35 Items)",
      category: "Gift boxes",
      price: 1499,
      mrp: 2499,
      image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&auto=format&fit=crop&q=60",
      description: "Complete celebration set: Sparklers, Flower Pots, Chakkars, Rockets, and Fancy items in an ornate red gift box.",
      pack_size: "Complete 35 items hamper",
      featured: 1
    },
    {
      name: "Royal Celebration VIP Hamper (50 Items)",
      category: "Gift boxes",
      price: 2999,
      mrp: 4999,
      image: "https://images.unsplash.com/photo-1508963493744-76fce69379c0?w=500&auto=format&fit=crop&q=60",
      description: "Premium collection featuring top-tier multi-shot aerial cakes, giant fountains, and family favourites.",
      pack_size: "Deluxe 50 items wooden trunk box",
      featured: 1
    },
    {
      name: "Kids Joy Sparkling Combo (20 Items)",
      category: "Gift boxes",
      price: 899,
      mrp: 1499,
      image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=500&auto=format&fit=crop&q=60",
      description: "Child-friendly low smoke, colourful items including pop pops, sparklers, magic pencil, and colourful pots.",
      pack_size: "20 Kid-safe items box",
      featured: 1
    }
  ];

  for (const item of sampleProducts) {
    db.run(`
      INSERT INTO products (name, category, price, mrp, image, description, pack_size, in_stock, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, [item.name, item.category, item.price, item.mrp, item.image, item.description, item.pack_size, item.featured]);
  }

  db.save();
  console.log(`Seeded ${sampleProducts.length} crackers successfully.`);
}

module.exports = { getDb };
