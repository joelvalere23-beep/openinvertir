import { Bot } from "grammy";
import { env } from "../config.js";
import { whitelistMiddleware } from "./middleware.js";
import { upsertUser } from "../memory/index.js";
import { runAgentLoop } from "../agent/loop.js";

import { TenantConfig } from "../config.js";

export function setupBot(tenant: TenantConfig) {
    const bot = new Bot(tenant.token);

    // 1. Manejar comando /start
    bot.command("start", async (ctx) => {
        try {
            if (!ctx.from) return;

            await upsertUser({
                id: ctx.from.id,
                first_name: ctx.from.first_name || null,
                last_name: ctx.from.last_name || null,
                username: ctx.from.username || null,
            }, tenant.id);

            await ctx.reply("¡Hola! Soy un asistente experto configurado para esta empresa. ¿En qué puedo ayudarte hoy?");
        } catch (error) {
            console.error(`❌ Error en comando /start para tenant ${tenant.id}:`, error);
            await ctx.reply("Lo siento, tuve un problema al iniciar. Por favor intenta de nuevo en un momento.");
        }
    });

    // 2. Manejar mensajes de texto
    bot.on("message:text", async (ctx) => {
        try {
            if (!ctx.from) return;

            // Guardar o actualizar usuario
            await upsertUser({
                id: ctx.from.id,
                first_name: ctx.from.first_name || null,
                last_name: ctx.from.last_name || null,
                username: ctx.from.username || null,
            }, tenant.id);

            const userMessage = ctx.message.text;

            // Mostramos acción de "escribiendo..." en Telegram
            await ctx.replyWithChatAction("typing");

            // Ejecutamos el agente pasando el tenant y su persona
            const agentResponse = await runAgentLoop(ctx.from.id, userMessage, tenant.id, tenant.persona);

            // Verificamos si la respuesta indica que se generó una imagen
            if (agentResponse.startsWith("IMAGEN_GENERADA|")) {
                const parts = agentResponse.split("|");
                const imageUrl = parts[1];
                const prompt = parts[2];
                
                await ctx.replyWithChatAction("upload_photo");
                await ctx.replyWithPhoto(imageUrl, {
                    caption: `🎨 He visualizado tu idea:\n\n"${prompt}"`
                });
            } else {
                await ctx.reply(agentResponse);
            }
        } catch (error: any) {
            console.error(`❌ ERROR AL PROCESAR MENSAJE en ${tenant.id}:`, error);
            await ctx.reply("Ocurrió un error al procesar tu mensaje. Por favor, inténtalo de nuevo.");
        }
    });

    // Iniciar bot
    bot.start({
        onStart: (botInfo) => {
            console.log(`🤖 Bot iniciado correctamente: @${botInfo.username} (Empresa: ${tenant.name})`);
        },
    });

    bot.catch((err) => {
        console.error(`🔥 ERROR GLOBAL DEL BOT (${tenant.id}):`, err);
    });

    return bot;
}
