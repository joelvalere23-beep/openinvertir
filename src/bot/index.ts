import { Bot, InputFile } from "grammy";
import axios from "axios";
import { env } from "../config.js";
import { upsertUser } from "../memory/index.js";
import { runAgentLoop } from "../agent/loop.js";
import { transcribeAudio, generateVoice } from "../utils/audio.js";
import os from "os";
import path from "path";
import fs from "fs-extra";

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
            await ctx.reply("Lo siento, tuve un problema al procesar tu audio.");
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
            await ctx.reply("Ocurrió un error al procesar tu mensaje. Por favor, inténtalo de nuevo.");
        }
    });

    // Nuevo: Comando de debug para ver qué está pasando
    bot.command("debug", async (ctx) => {
        const info = [
            `🤖 Bot: ${tenant.name}`,
            `🆔 Tenant ID: ${tenant.id}`,
            `👤 Persona: ${tenant.persona ? "Personalizada" : "Por defecto (Openinvertit)"}`,
            `🔑 Tiene OpenRouter: ${env.OPENROUTER_API_KEY ? "SÍ" : "NO"}`,
            `🔑 Tiene OpenAI: ${env.OPENAI_API_KEY ? "SÍ" : "NO"}`,
            `🔑 Tiene Groq: ${env.GROQ_API_KEY ? "SÍ" : "NO"}`,
        ].join("\n");
        await ctx.reply(info);
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
