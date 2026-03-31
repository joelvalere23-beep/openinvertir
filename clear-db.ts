import admin from "firebase-admin";
import { env } from "./src/config.js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const firebaseJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
let serviceAccount;

if (firebaseJson) {
    serviceAccount = JSON.parse(firebaseJson);
} else if (fs.existsSync(env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
    serviceAccount = JSON.parse(fs.readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8"));
}

if (!serviceAccount) {
    console.error("❌ No se encontró configuración de Firebase.");
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function clearAllData() {
    console.log("🧹 Iniciando limpieza de datos en Firestore...");
    
    const tenantsSnapshot = await db.collection("tenants").get();
    
    for (const tenantDoc of tenantsSnapshot.docs) {
        const usersSnapshot = await tenantDoc.ref.collection("users").get();
        for (const userDoc of usersSnapshot.docs) {
            // Limpiar memoria
            const memorySnapshot = await userDoc.ref.collection("memory").get();
            const batch = db.batch();
            memorySnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            console.log(`✅ Memoria del usuario ${userDoc.id} en tenant ${tenantDoc.id} borrada.`);
        }
    }
    
    console.log("✨ Todos los datos viejos han sido barridos.");
}

clearAllData().catch(console.error);
