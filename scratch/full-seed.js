const { createClient } = require("@libsql/client");
const bcrypt = require("bcryptjs");

async function fullSeed() {
  const client = createClient({
    url: "libsql://corelab-db-oliver-oberto.aws-eu-west-1.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzcxNTgzMTcsImlkIjoiMDE5ZGM2ZTMtN2YwMS03Yzc2LTk3YzMtZjE0ZDViYzBhMTUzIiwicmlkIjoiMzg2ODc1ZWYtYzBhNS00ZTJjLWE4M2ItYTY1YmVkOGI5ODk1In0.WS-Qk2IafKvzutW5Hsw8LU7752WWlQxuZnCGoNcA_kYER97al1CgZXBHokE1F91-rsSY3mKmZoozVI_G_I33Cg",
  });

  try {
    console.log("Setting up tables...");
    await client.executeMultiple(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        icon TEXT DEFAULT '💊'
      );
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        original_price REAL,
        category_id INTEGER,
        brand TEXT NOT NULL DEFAULT 'Cellpure',
        stock INTEGER NOT NULL DEFAULT 0,
        image_url TEXT,
        images TEXT DEFAULT '[]',
        featured INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        weight TEXT,
        flavor TEXT,
        servings INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Seeding categories...");
    const cats = [
      ["Proteínas", "proteinas", "🥛"],
      ["Creatina", "creatina", "💪"],
      ["Pre-Entreno", "pre-entreno", "⚡"],
      ["Aminoácidos", "aminoacidos", "🧬"],
      ["Vitaminas", "vitaminas", "🌿"]
    ];
    for(const [n, s, i] of cats) {
      await client.execute({
        sql: "INSERT OR IGNORE INTO categories (name, slug, icon) VALUES (?, ?, ?)",
        args: [n, s, i]
      });
    }

    console.log("Seeding admin...");
    const adminHash = bcrypt.hashSync("admin123", 12);
    await client.execute({
      sql: "INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      args: ["Admin CoreLab", "admin@corelab.com", adminHash, "admin"]
    });

    console.log("Database seeded successfully!");
  } catch (err) {
    console.error("Seed error:", err);
  }
}

fullSeed();
