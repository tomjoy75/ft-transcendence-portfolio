import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const dbPath = './src/db/users.db';

const run = async () => {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  const columns = await db.all(`PRAGMA table_info(users);`);
  console.log("📊 Colonnes de la table users:");
  columns.forEach(col => {
    console.log(`- ${col.name} (${col.type})`);
  });

  await db.close();
};

run();
