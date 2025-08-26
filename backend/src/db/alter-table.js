import { initDB } from './sqlite.js'

async function addAliasColumn() {
    const db = await initDB(); 
    try{
        await db.run("ALTER TABLE users ADD COLUMN alias TEXT");
        console.log("Columm alias created successfully");
    } catch (err){
        console.error("Failed to add column: ", err.message);
    }
}

addAliasColumn();