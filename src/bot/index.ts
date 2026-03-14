import { Bot } from "grammy";
import { env } from "../config.js";
import { whitelistMiddleware } from "./middleware.js";
import { upsertUser } from "../memory/index.js";
import { runAgentLoop } from "../agent/loop.js";

export function setupBot() {
    const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

    // 1. Aplicar lista blanca (whitelist) a todas las interacciones
    // bot.use(whitelistMiddleware); // Comentado para permitir acceso público

    // 2. Manejar comando /start
    bot.command("start", async (ctx) => {
        try {
            if (!ctx.from) return;

            await upsertUser({
                id: ctx.from.id,
                first_name: ctx.from.first_name || null,
                last_name: ctx.from.last_name || null,
                username: ctx.from.username || null,
            });

            await ctx.reply("¡Hola! Soy Openinvertit, tu asesor financiero experto en bienes raíces en República Dominicana. ¿En qué puedo ayudarte a invertir hoy?");
        } catch (error) {
            console.error("❌ Error en comando /start:", error);
            await ctx.reply("Lo siento, tuve un problema al iniciar. Por favor intenta de nuevo en un momento.");
        }
    });

    // 3. Manejar mensajes de texto
    bot.on("message:text", async (ctx) => {
        try {
            if (!ctx.from) return;

            // Guardar o actualizar usuario
            await upsertUser({
                id: ctx.from.id,
                first_name: ctx.from.first_name || null,
                last_name: ctx.from.last_name || null,
                username: ctx.from.username || null,
            });

            const userMessage = ctx.message.text;

            // Mostramos acción de "escribiendo..." en Telegram
            await ctx.replyWithChatAction("typing");

            // Ejecutamos el agente
            const agentResponse = await runAgentLoop(ctx.from.id, userMessage);

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
                // Enviamos la respuesta sin parse_mode para evitar errores de Markdown mal formado
                await ctx.reply(agentResponse);
            }
        } catch (error: any) {
            console.error("❌ ERROR AL PROCESAR MENSAJE:", error);
            await ctx.reply("Ocurrió un error al procesar tu mensaje. Por favor, inténtalo de nuevo.");
        }
    });

    // Iniciar bot
    bot.start({
        onStart: (botInfo) => {
            console.log(`🤖 Bot iniciado correctamente como @${botInfo.username}`);
        },
    });

    bot.catch((err) => {
        console.error("🔥 ERROR GLOBAL DEL BOT:", err);
    });

    return bot;
}
