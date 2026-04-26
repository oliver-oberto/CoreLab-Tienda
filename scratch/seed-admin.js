const { createClient } = require("@libsql/client");
const bcrypt = require("bcryptjs");

async function seedAdmin() {
  const client = createClient({
    url: "libsql://corelab-db-oliver-oberto.aws-eu-west-1.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzcxNTgzMTcsImlkIjoiMDE5ZGM2ZTMtN2YwMS03Yzc2LTk3YzMtZjE0ZDViYzBhMTUzIiwicmlkIjoiMzg2ODc1ZWYtYzBhNS00ZTJjLWE4M2ItYTY1YmVkOGI5ODk1In0.WS-Qk2IafKvzutW5Hsw8LU7752WWlQxuZnCGoNcA_kYER97al1CgZXBHokE1F91-rsSY3mKmZoozVI_G_I33Cg",
  });

  const adminHash = bcrypt.hashSync("admin123", 12);
  
  try {
    // Primero asegurarnos que la tabla existe
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute({
      sql: "INSERT OR REPLACE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      args: ["Admin CoreLab", "admin@corelab.com", adminHash, "admin"]
    });
    console.log("Admin user seeded successfully!");
  } catch (err) {
    console.error("Error seeding admin:", err);
  }
}

seedAdmin();
