import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "corelab.db");

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
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
      category_id INTEGER REFERENCES categories(id),
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

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      total REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      product_name TEXT NOT NULL,
      product_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
    CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
  `);

  seedData();
}

function seedData() {
  const count = db.prepare("SELECT COUNT(*) as c FROM categories").get() as { c: number };
  if (count.c > 0) return;

  // Categories
  const insertCat = db.prepare("INSERT OR IGNORE INTO categories (name, slug, icon) VALUES (?, ?, ?)");
  const categories = [
    ["Proteínas", "proteinas", "🥛"],
    ["Creatina", "creatina", "💪"],
    ["Pre-Entreno", "pre-entreno", "⚡"],
    ["Aminoácidos", "aminoacidos", "🧬"],
    ["Vitaminas", "vitaminas", "🌿"],
    ["Recuperación", "recuperacion", "🔄"],
    ["Colágeno", "colageno", "✨"],
    ["Minerales", "minerales", "⚗️"],
  ];
  categories.forEach((c) => insertCat.run(...c));

  // Admin user
  const bcrypt = require("bcryptjs");
  const adminHash = bcrypt.hashSync("admin123", 12);
  db.prepare(
    "INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)"
  ).run("Admin CoreLab", "admin@corelab.com", adminHash, "admin");

  // Products
  const insertProd = db.prepare(`
    INSERT OR IGNORE INTO products 
    (name, slug, description, price, original_price, category_id, brand, stock, image_url, images, featured, weight, flavor, servings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    [
      "Whey Protein Concentrate 80%",
      "whey-protein-chocolate",
      "Proteína de suero de alta calidad con 24g de proteína por porción. Ideal para el desarrollo y recuperación muscular post-entrenamiento. Sin azúcar añadida, bajo en grasa.",
      12500, 14900, 1, "Cellpure", 45,
      "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600",
      JSON.stringify([
        "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600",
        "https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=600",
      ]),
      1, "907g", "Chocolate", 30,
    ],
    [
      "Whey Protein Vainilla",
      "whey-protein-vainilla",
      "Proteína de suero premium sabor vainilla. 24g de proteína por porción, textura cremosa y sabor inigualable. Mezcla perfecta con agua o leche.",
      12500, 14900, 1, "Cellpure", 38,
      "https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=600",
      JSON.stringify([
        "https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=600",
        "https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=600",
      ]),
      1, "907g", "Vainilla", 30,
    ],
    [
      "Creatina Monohidratada",
      "creatina-monohidratada",
      "Creatina monohidratada micronizada de máxima pureza (99.9%). Aumenta la fuerza, potencia y rendimiento en entrenamientos de alta intensidad. Sin saborizantes ni aditivos.",
      8900, 10500, 2, "Cellpure", 60,
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600",
      JSON.stringify([
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600",
        "https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=600",
      ]),
      1, "300g", "Sin sabor", 60,
    ],
    [
      "Citrato de Magnesio",
      "citrato-de-magnesio",
      "Citrato de magnesio de máxima absorción con 2460mg por porción. Vitaminas B6 y C incluidas. Reduce el cansancio, mejora el sueño y la función muscular.",
      7500, 9200, 8, "Cellpure", 72,
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600",
      JSON.stringify([
        "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600",
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600",
      ]),
      1, "190g", "Sin sabor", 30,
    ],
    [
      "Pre-Entreno Explosive",
      "pre-entreno-explosive",
      "Pre-entreno de alto rendimiento con cafeína, beta-alanina, citrulina y arginina. Máxima energía, foco mental y pump muscular para entrenamientos intensos.",
      13800, 16500, 3, "Cellpure", 28,
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600",
      JSON.stringify([
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600",
        "https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=600",
      ]),
      1, "300g", "Sandía", 30,
    ],
    [
      "BCAA 2:1:1",
      "bcaa-211",
      "Aminoácidos de cadena ramificada en proporción óptima 2:1:1. Previene el catabolismo muscular, acelera la recuperación y reduce el dolor post-entrenamiento.",
      9800, 11500, 4, "Cellpure", 42,
      "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600",
      JSON.stringify([
        "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600",
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600",
      ]),
      0, "300g", "Limón", 30,
    ],
    [
      "Glutamina Pura",
      "glutamina-pura",
      "L-Glutamina micronizada de grado farmacéutico. Mejora la recuperación muscular, fortalece el sistema inmunitario y reduce el agotamiento post-entrenamiento.",
      7200, 8800, 5, "Cellpure", 55,
      "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600",
      JSON.stringify([
        "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600",
        "https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=600",
      ]),
      0, "300g", "Sin sabor", 60,
    ],
    [
      "Vitamina C 1000mg",
      "vitamina-c-1000",
      "Vitamina C de alta dosis con 1000mg por cápsula. Potente antioxidante que fortalece el sistema inmune, mejora la recuperación y protege el tejido muscular.",
      4500, 5800, 5, "Cellpure", 90,
      "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=600",
      JSON.stringify([
        "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=600",
      ]),
      0, "60 cápsulas", null, 60,
    ],
    [
      "Colágeno Hidrolizado + C",
      "colageno-hidrolizado",
      "Colágeno hidrolizado tipo I y III con vitamina C. Mejora la salud articular, piel y tejidos conectivos. Ideal para deportistas que someten sus articulaciones a gran carga.",
      9500, 11200, 7, "Cellpure", 33,
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600",
      JSON.stringify([
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600",
        "https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=600",
      ]),
      0, "300g", "Sin sabor", 30,
    ],
    [
      "Omega 3 Fish Oil",
      "omega-3-fish-oil",
      "Aceite de pescado de alta concentración con 1000mg EPA/DHA por cápsula. Reduce la inflamación, mejora la salud cardiovascular y acelera la recuperación muscular.",
      6800, 8200, 5, "Cellpure", 48,
      "https://images.unsplash.com/photo-1576671081837-49000212a370?w=600",
      JSON.stringify([
        "https://images.unsplash.com/photo-1576671081837-49000212a370?w=600",
      ]),
      0, "90 cápsulas", null, 90,
    ],
    [
      "Whey Protein Frutilla",
      "whey-protein-frutilla",
      "Proteína de suero premium con delicioso sabor a frutilla. 24g de proteína pura por porción. Baja en calorías y carbohidratos.",
      12500, 14900, 1, "Cellpure", 25,
      "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600",
      JSON.stringify([
        "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600",
        "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600",
      ]),
      0, "907g", "Frutilla", 30,
    ],
    [
      "Pre-Entreno Blue Raspberry",
      "pre-entreno-blue-raspberry",
      "Fórmula avanzada de pre-entreno con 200mg de cafeína, 6g de citrulina y 3.2g de beta-alanina. Sabor Blue Raspberry intenso. Máximo rendimiento garantizado.",
      13800, null, 3, "Cellpure", 20,
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600",
      JSON.stringify([
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600",
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600",
      ]),
      0, "300g", "Blue Raspberry", 30,
    ],
  ];

  products.forEach((p) => insertProd.run(...p));
}

export default getDb;
