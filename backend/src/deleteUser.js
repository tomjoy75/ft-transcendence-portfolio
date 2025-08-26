// TOOL for dev 
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { initDB } from './db/sqlite.js';


// const db = await open({
// 	filename: './src/db/users.db',
// 	driver: sqlite3.Database
// });
const db = await initDB()

await db.run("DELETE FROM users");
console.log("User deleted");

await db.close();