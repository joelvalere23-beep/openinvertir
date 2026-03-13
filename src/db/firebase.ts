import admin from "firebase-admin";
import { env } from "../config.js";
import fs from "fs";

const firebaseJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (firebaseJson) {
    try {
        const serviceAccount = JSON.parse(firebaseJson);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("🔥 Firebase Admin inicializado desde variable de entorno.");
    } catch (e) {
        console.error("❌ Error al parsear FIREBASE_SERVICE_ACCOUNT_JSON:", e);
    }
} else if (fs.existsSync(env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
    const serviceAccount = JSON.parse(fs.readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8"));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("🔥 Firebase Admin inicializado desde archivo local.");
} else {
    console.error(`❌ No se encontró configuración de Firebase. Verifica FIREBASE_SERVICE_ACCOUNT_JSON o el archivo en: ${env.FIREBASE_SERVICE_ACCOUNT_PATH}`);
}


export const db = admin.apps.length > 0 ? admin.firestore() : null;

if (db) {
    db.settings({ ignoreUndefinedProperties: true });
    console.log("📂 Firestore listo para peticiones.");
} else {
    console.error("❌ Firestore NO inicializado. Las peticiones podrían fallar.");
}

