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
    console.log("Iniciando Openinvertit...");

    console.log("Inicializando base de datos...");
    await initDb();

    console.log("Iniciando bot de Telegram...");
    const bot = setupBot();

    console.log("Iniciando cliente de WhatsApp (espera al QR)...");
    const waClient = setupWhatsApp();

    // Manejo correcto de cierre
    process.once("SIGINT", async () => {
        console.log("Deteniendo bots...");
        await bot.stop();
        await waClient.destroy();
        console.log("Cerrando conexión a BD...");
        const db = await dbPromise;
        await db.close();
        process.exit(0);
    });

    process.once("SIGTERM", async () => {
        console.log("Deteniendo bots...");
        await bot.stop();
        await waClient.destroy();
        console.log("Cerrando conexión a BD...");
        const db = await dbPromise;
        await db.close();
        process.exit(0);
    });
}

main().catch(console.error);
