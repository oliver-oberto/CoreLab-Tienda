const { createClient } = require("@libsql/client");

async function checkAdmin() {
  const client = createClient({
    url: "libsql://corelab-db-oliver-oberto.aws-eu-west-1.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzcxNTgzMTcsImlkIjoiMDE5ZGM2ZTMtN2YwMS03Yzc2LTk3YzMtZjE0ZDViYzBhMTUzIiwicmlkIjoiMzg2ODc1ZWYtYzBhNS00ZTJjLWE4M2ItYTY1YmVkOGI5ODk1In0.WS-Qk2IafKvzutW5Hsw8LU7752WWlQxuZnCGoNcA_kYER97al1CgZXBHokE1F91-rsSY3mKmZoozVI_G_I33Cg",
  });

  try {
    const rs = await client.execute("SELECT id, email, role FROM users WHERE email = 'admin@corelab.com'");
    console.log("Admin User found:", rs.rows);
  } catch (err) {
    console.error("Error checking DB:", err);
  }
}

checkAdmin();
