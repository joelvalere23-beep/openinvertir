import http from "http";
import { setupBot } from "./bot/index.js";
import { setupWhatsApp } from "./whatsapp/index.js";
import { initDb, dbPromise } from "./db/index.js";
import url from "url";
import { getGoogleTokens } from "./auth/google.js";
import { getMicrosoftTokens } from "./auth/microsoft.js";
import { saveTokens } from "./memory/index.js";

// Servidor de salud y OAuth Callbacks
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url || "", true);
    const path = parsedUrl.pathname;

    if (path === "/") {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OpenInvertit is running\n');
        return;
    }

    // Callback de Google
    if (path === "/auth/google/callback") {
        const code = parsedUrl.query.code as string;
        const stateStr = parsedUrl.query.state as string;
        
        try {
            const state = JSON.parse(Buffer.from(stateStr, "base64").toString());
            const tokens = await getGoogleTokens(code);
            await saveTokens(state.userId, state.tenantId, "google", tokens);
            
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>✅ ¡Conexión con Google exitosa!</h1><p>Ya puedes cerrar esta ventana y volver al bot.</p>');
        } catch (e) {
            console.error("Error en callback de Google:", e);
            res.writeHead(500);
            res.end("Error al procesar la autenticación de Google");
        }
        return;
    }

    // Callback de Microsoft
    if (path === "/auth/microsoft/callback") {
        const code = parsedUrl.query.code as string;
        const stateStr = parsedUrl.query.state as string;

        try {
            const state = JSON.parse(Buffer.from(stateStr, "base64").toString());
            const response = await getMicrosoftTokens(code);
            await saveTokens(state.userId, state.tenantId, "microsoft", response.account);
            
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>✅ ¡Conexión con Microsoft exitosa!</h1><p>Ya puedes cerrar esta ventana y volver al bot.</p>');
        } catch (e) {
            console.error("Error en callback de Microsoft:", e);
            res.writeHead(500);
            res.end("Error al procesar la autenticación de Microsoft");
        }
        return;
    }

    res.writeHead(404);
    res.end();
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
