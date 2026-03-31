import { Bot, InputFile } from "grammy";
import axios from "axios";
import { env } from "../config.js";
import { upsertUser } from "../memory/index.js";
import { runAgentLoop } from "../agent/loop.js";
import { transcribeAudio, generateVoice } from "../utils/audio.js";
import { whitelistMiddleware } from "./middleware.js";
import os from "os";
import path from "path";
import fs from "fs-extra";

import { TenantConfig } from "../config.js";

export function setupBot(tenant: TenantConfig) {
    const bot = new Bot(tenant.token);

    // Middleware de funnel: registra todos los leads y permite el paso
    bot.use(whitelistMiddleware);

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

            const greeting = `🌟 **BIENVENIDO A OPENINVERTIT v2.0 (IMPULSADO POR GPT-4o)**
¡Hola, ${ctx.from.first_name || "inversor"}! Soy tu Asistente Senior de Inteligencia Artificial.

He sido actualizado con capacidades multimodales completas. Ahora puedo asistirte en **TODO** lo que necesites con la misma fluidez que ChatGPT:

✅ **ANÁLISIS DE IMÁGENES:** Envíame cualquier foto, plano o contrato y lo analizaré por ti.
🎨 **GENERACIÓN DE ARTE (DALL-E 3):** Pídeme que genere cualquier concepto visual o diseño.
📊 **INVERSIÓN REAL ESTATE:** Soy experto en Punta Cana, Santo Domingo y Samaná.
📅 **GESTIÓN PERSONAL:** Puedo redactar correos, agendar citas y organizar tu día.
🌍 **BÚSQUEDA WEB:** Acceso a información en tiempo real de cualquier mercado.

💎 **GRUPO VIP:** Usa /vip para acceder al círculo de compras conjuntas (10 EUR/mes).

¿En qué increíble proyecto financiero o personal trabajamos hoy?`;

            await ctx.reply(greeting, { parse_mode: "Markdown" });

        } catch (error) {
            console.error(`❌ Error en comando /start para tenant ${tenant.id}:`, error);
            await ctx.reply("Lo siento, tuve un problema al iniciar. Por favor intenta de nuevo en un momento.");
        }
    });

    // 2. Manejar mensajes de voz
    bot.on("message:voice", async (ctx) => {
        let voicePath = "";
        let responseAudioPath = "";
        try {
            console.log(`[Voz] Recibido mensaje de voz de ${ctx.from.id}`);
            await ctx.replyWithChatAction("record_voice");

            const file = await ctx.getFile();
            const url = `https://api.telegram.org/file/bot${tenant.token}/${file.file_path}`;
            
            voicePath = path.join(os.tmpdir(), `voice_${Date.now()}.ogg`);
            const writer = fs.createWriteStream(voicePath);
            
            const response = await axios.get(url, { responseType: 'stream' });
            response.data.pipe(writer);
            
            await new Promise<void>((resolve, reject) => {
                writer.on('finish', () => resolve());
                writer.on('error', (err: any) => reject(err));
            });

            const transcription = await transcribeAudio(voicePath);
            if (!transcription) {
                await ctx.reply("Lo siento, no pude entender tu mensaje de voz.");
                return;
            }

            const agentResponse = await runAgentLoop(ctx.from.id, transcription, tenant.id, tenant.persona);
            
            responseAudioPath = path.join(os.tmpdir(), `response_${Date.now()}.mp3`);
            const hasVoice = await generateVoice(agentResponse.text, responseAudioPath);

            if (hasVoice) {
                await ctx.replyWithVoice(new InputFile(responseAudioPath));
            }
            
            await ctx.reply(agentResponse.text);
            
            if (agentResponse.images && agentResponse.images.length > 0) {
                console.log(`[Bot] Enviando ${agentResponse.images.length} imágenes...`);
                for (const imageUrl of agentResponse.images) {
                    try {
                        if (imageUrl.startsWith("data:image")) {
                            const base64Data = imageUrl.split(",")[1];
                            const buffer = Buffer.from(base64Data, "base64");
                            await ctx.replyWithPhoto(new InputFile(buffer, "imagen_generada.png"));
                        } else {
                            await ctx.replyWithPhoto(imageUrl);
                        }
                    } catch (picError: any) {
                        console.error("Error enviando foto a Telegram (Voz):", picError.message);
                        await ctx.reply(`No pude mostrar la imagen directamente, pero aquí está el link: ${imageUrl}`);
                    }
                }
            }

        } catch (e: any) {
            console.error(`❌ Error procesando voz:`, e);
            await ctx.reply(`Lo siento, tuve un problema al procesar tu audio: ${e.message}`);
        } finally {
            if (voicePath && fs.existsSync(voicePath)) await fs.remove(voicePath);
            if (responseAudioPath && fs.existsSync(responseAudioPath)) await fs.remove(responseAudioPath);
        }
    });

    // 3. Manejar mensajes de texto
    bot.on("message:text", async (ctx) => {
        try {
            if (!ctx.from) return;

            await upsertUser({
                id: ctx.from.id,
                first_name: ctx.from.first_name || null,
                last_name: ctx.from.last_name || null,
                username: ctx.from.username || null,
            }, tenant.id);

            const userMessage = ctx.message.text;
            await ctx.replyWithChatAction("typing");

            const agentResponse = await runAgentLoop(ctx.from.id, userMessage, tenant.id, tenant.persona);

            await ctx.reply(agentResponse.text);

            if (agentResponse.images && agentResponse.images.length > 0) {
                console.log(`[Bot] Enviando ${agentResponse.images.length} imágenes...`);
                for (const imageUrl of agentResponse.images) {
                    try {
                        if (imageUrl.startsWith("data:image")) {
                            const base64Data = imageUrl.split(",")[1];
                            const buffer = Buffer.from(base64Data, "base64");
                            await ctx.replyWithPhoto(new InputFile(buffer, "imagen_generada.png"));
                        } else {
                            await ctx.replyWithPhoto(imageUrl);
                        }
                    } catch (picError: any) {
                        console.error("Error enviando foto a Telegram (Texto):", picError.message);
                        await ctx.reply(`No pude mostrar la imagen directamente por un problema técnico de Telegram, pero aquí está el link: ${imageUrl}`);
                    }
                }
            }
        } catch (error: any) {
            console.error(`❌ ERROR AL PROCESAR MENSAJE en ${tenant.id}:`, error);
            await ctx.reply(`Ocurrió un error al procesar tu mensaje: ${error.message}. Por favor, inténtalo de nuevo.`);
        }
    });

    // 4. Manejar fotos (Visión)
    bot.on("message:photo", async (ctx) => {
        try {
            if (!ctx.from) return;
            console.log(`[Visión] Recibida imagen de ${ctx.from.id}`);
            await ctx.replyWithChatAction("typing");

            // Obtenemos la foto de mayor calidad
            const photo = ctx.message.photo[ctx.message.photo.length - 1];
            const file = await ctx.getFile();
            const imageUrl = `https://api.telegram.org/file/bot${tenant.token}/${file.file_path}`;

            const caption = ctx.message.caption || "¿Qué ves en esta imagen?";
            
            const agentResponse = await runAgentLoop(ctx.from.id, caption, tenant.id, tenant.persona, imageUrl);

            await ctx.reply(agentResponse.text);

            // También manejamos si el agente genera imágenes en respuesta
            if (agentResponse.images && agentResponse.images.length > 0) {
                for (const resImg of agentResponse.images) {
                    await ctx.replyWithPhoto(resImg);
                }
            }
        } catch (e: any) {
            console.error(`❌ Error procesando foto:`, e);
            await ctx.reply(`Lo siento, no pude analizar la imagen: ${e.message}`);
        }
    });


    // Comando de versión
    bot.command("ping", async (ctx) => {
        await ctx.reply("PONG - v1.0.2 - Sistema activo y operacional.");
    });

    // Comando de debug para ver estado del sistema
    bot.command("debug", async (ctx) => {
        const info = [
            `🤖 Bot: ${tenant.name}`,
            `🆔 Tenant ID: ${tenant.id}`,
            `👤 Persona: ${tenant.persona ? "Personalizada" : "Por defecto (Openinvertit)"}`,
            `🔑 Tiene OpenRouter: ${env.OPENROUTER_API_KEY ? "SÍ" : "NO"}`,
            `🔑 Tiene OpenAI: ${env.OPENAI_API_KEY ? "SÍ" : "NO"}`,
            `🔑 Tiene Groq: ${env.GROQ_API_KEY ? "SÍ" : "NO"}`,
            `🏗️ Grupo VIP configurado: ${process.env.TELEGRAM_VIP_GROUP_ID ? "SÍ" : "NO (falta TELEGRAM_VIP_GROUP_ID)"}`,
        ].join("\n");
        await ctx.reply(info);
    });

    // Comando /vip: pitch directo de venta al Grupo VIP
    bot.command("vip", async (ctx) => {
        const pitch = `💎 GRUPO VIP DE INVERSORES - ACCESO EXCLUSIVO

¿Quieres invertir en República Dominicana con los mejores del sector?

Al unirte al Grupo VIP privado obtienes:
- Oportunidades de crowdfunding inmobiliario (compras conjuntas)
- Propiedades exclusivas antes de salir al mercado
- Asesoría directa del equipo de Openinvertit
- Alertas de rentabilidad en tiempo real

Precio: 10 EUR o 10 USD al mes
Pago via PayPal: joelvalere23@gmail.com

Una vez realizado el pago, escríbeme aquí confirmando y te envío el enlace de acceso inmediato.`;

        await ctx.reply(pitch);
    });

    // Iniciar bot
    bot.start({
        onStart: (botInfo) => {
            console.log(`🤖 Bot iniciado: @${botInfo.username}`);
        },
    });

    bot.catch((err) => {
        console.error(`🔥 Error global:`, err);
    });

    return bot;
}
