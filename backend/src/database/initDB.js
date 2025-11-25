const { openDb } = require("./database");

async function init() {
  const db = await openDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    )
  `);

  console.log("Database initialized!");
}

init();
