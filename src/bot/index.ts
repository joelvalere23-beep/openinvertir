import { Bot, InputFile } from "grammy";
import axios from "axios";
import { env } from "../config.js";
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
            
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
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
                for (const imageUrl of agentResponse.images) {
                    await ctx.replyWithPhoto(imageUrl);
                }
            }

        } catch (e) {
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
                for (const imageUrl of agentResponse.images) {
                    await ctx.replyWithPhoto(imageUrl);
                }
            }
        } catch (error: any) {
            console.error(`❌ Error texto:`, error);
            await ctx.reply("Ocurrió un error al procesar tu mensaje. Por favor, inténtalo de nuevo.");
        }
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
