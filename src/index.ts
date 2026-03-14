import { setupBot } from "./bot/index.js";
import { setupWhatsApp } from "./whatsapp/index.js";
import { initDb, dbPromise } from "./db/index.js";
import http from "http";

// Servidor de salud (Health Check) para mantener vivo el bot en la nube
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OpenInvertit is running\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Servidor de salud activo en puerto ${PORT}`);
});

import { tenants } from "./config.js";

async function main() {
    console.log("🚀 Iniciando Openinvertit en modo Multi-Tenant (Super Robot)...");

    try {
        console.log("📂 Inicializando base de datos...");
        await initDb();
    } catch (e) {
        console.error("❌ Error al inicializar base de datos:", e);
    }

    const bots: any[] = [];

    console.log(`🤖 Iniciando ${tenants.length} bots de Telegram...`);
    for (const tenant of tenants) {
        try {
            const bot = setupBot(tenant);
            bots.push(bot);
        } catch (e) {
            console.error(`❌ Falló arranque de bot para ${tenant.name}:`, e);
        }
    }

    try {
        console.log("📱 Iniciando cliente de WhatsApp (Empresa principal)...");
        const waClient = setupWhatsApp();
        
        const cleanup = async () => {
            console.log("Deteniendo todos los servicios...");
            for (const bot of bots) await bot.stop();
            await waClient.destroy();
            const db = await dbPromise;
            await db.close();
            process.exit(0);
        };

        process.once("SIGINT", cleanup);
        process.once("SIGTERM", cleanup);

    } catch (e) {
        console.error("⚠️ WhatsApp no disponible. Los bots de Telegram seguirán funcionando.");
        
        const cleanup = async () => {
            console.log("Deteniendo bots de Telegram...");
            for (const bot of bots) await bot.stop();
            const db = await dbPromise;
            await db.close();
            process.exit(0);
        };

        process.once("SIGINT", cleanup);
        process.once("SIGTERM", cleanup);
    }
}

main().catch(err => {
    console.error("🔥 ERROR FATAL EN EL ARRANQUE:", err);
    process.exit(1);
});
