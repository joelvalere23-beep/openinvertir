import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear la carpeta del archivo de DB si no existe
const dbDir = path.resolve(__dirname, "../../data");
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "agent.db");

// Usamos el wrapper 'sqlite' sobre 'sqlite3' para tener promesas
export const dbPromise = open({
    filename: dbPath,
    driver: sqlite3.Database
});

// Inicializamos la base de datos
export async function initDb() {
    const db = await dbPromise;

    // Habilitar Foreign Keys de SQLite y Wal mode
    await db.exec("PRAGMA journal_mode = WAL;");
    await db.exec("PRAGMA foreign_keys = ON;");

    // Cargar y ejecutar esquema inicial
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaCode = fs.readFileSync(schemaPath, "utf8");
    await db.exec(schemaCode);

    return db;
}
