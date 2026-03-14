import { Bot, InputFile } from "grammy";
import axios from "axios";
import { env } from "../config.js";
import { whitelistMiddleware } from "./middleware.js";
import { upsertUser } from "../memory/index.js";
import { runAgentLoop } from "../agent/loop.js";
import { transcribeAudio, generateVoice } from "../utils/audio.js";
import path from "path";
import fs from "fs-extra";
import os from "os";

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

    // 2. Manejar mensajes de voz
    bot.on("message:voice", async (ctx) => {
        try {
            console.log(`📥 Recibido mensaje de voz de ${ctx.from.first_name}...`);
            await ctx.replyWithChatAction("record_voice");

            // 1. Obtener archivo de voz
            const file = await ctx.getFile();
            const fileUrl = `https://api.telegram.org/file/bot${tenant.token}/${file.file_path}`;
            console.log(`🔗 Descargando audio desde: ${file.file_id}`);
            
            // 2. Descargar localmente para procesar
            const tempDir = os.tmpdir();
            const voicePath = path.join(tempDir, `voice_${Date.now()}.ogg`);
            
            const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
            await fs.writeFile(voicePath, response.data);
            console.log(`✅ Archivo guardado en: ${voicePath}`);

            // 3. Transcribir a texto
            console.log("🎙️ Transcribiendo audio...");
            const transcribedText = await transcribeAudio(voicePath);
            
            if (!transcribedText) {
                console.error("❌ Fallo en la transcripción: El texto está vacío");
                await ctx.reply("Lo siento, no pude entender tu mensaje de voz. ¿Podrías repetirlo?");
                return;
            }

            console.log(`📝 Transcripción exitosa: "${transcribedText}"`);

            // 4. Pasar al agente
            console.log("🧠 Consultando al agente...");
            const agentResponse = await runAgentLoop(ctx.from.id, transcribedText, tenant.id, tenant.persona);
            console.log(`🤖 Respuesta del agente: "${agentResponse.substring(0, 50)}..."`);

            // 5. Generar respuesta por voz (opcional si hay API Key)
            const responseAudioPath = path.join(tempDir, `resp_${Date.now()}.mp3`);
            console.log("🔊 Intentando generar voz de respuesta...");
            const hasVoice = await generateVoice(agentResponse, responseAudioPath);

            if (hasVoice) {
                console.log("📤 Enviando respuesta de voz...");
                await ctx.replyWithVoice(new InputFile(responseAudioPath));
                // Limpiar temporales
                await fs.remove(responseAudioPath);
            } else {
                console.log("📤 Enviando respuesta de texto (TTS falló o no está configurado)");
                await ctx.reply(agentResponse);
            }

            // Limpiar archivo de entrada
            await fs.remove(voicePath);
            console.log("🧹 Limpieza de temporales completada");

        } catch (error) {
            console.error(`❌ Error en mensajes de voz (${tenant.id}):`, error);
            await ctx.reply("Tuve un problema procesando tu mensaje de voz.");
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
