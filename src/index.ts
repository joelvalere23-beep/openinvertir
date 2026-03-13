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

async function main() {
    console.log("🚀 Iniciando Openinvertit en modo Cloud...");

    try {
        console.log("📂 Inicializando base de datos...");
        await initDb();
    } catch (e) {
        console.error("❌ Error al inicializar base de datos:", e);
        // Intentamos seguir aunque la BD falle (el bot avisará en los logs)
    }

    console.log("🤖 Iniciando bot de Telegram...");
    const bot = setupBot();

    try {
        console.log("📱 Iniciando cliente de WhatsApp...");
        const waClient = setupWhatsApp();
        
        // Manejo de cierre para WhatsApp
        const cleanup = async () => {
            console.log("Deteniendo bots...");
            await bot.stop();
            await waClient.destroy();
            const db = await dbPromise;
            await db.close();
            process.exit(0);
        };

        process.once("SIGINT", cleanup);
        process.once("SIGTERM", cleanup);

    } catch (e) {
        console.error("⚠️ No se pudo iniciar el cliente de WhatsApp. El bot de Telegram seguirá funcionando.", e);
        
        const cleanup = async () => {
            console.log("Deteniendo bot de Telegram...");
            await bot.stop();
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
