const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    await db.execute('ALTER TABLE categories ADD COLUMN description TEXT');
    console.log('Column added successfully');
  } catch (e) {
    if (e.message.includes('duplicate column name')) {
      console.log('Column already exists');
    } else {
      console.error(e);
    }
  }
}

run();
