import axios from "axios";
import OpenAI from "openai";
import { env } from "../config.js";
import fs from "fs-extra";
import path from "path";
import FormData from "form-data";

/**
 * Transcribe un archivo de audio (Generalmente OGG en Telegram) a texto usando Groq o OpenAI.
 */
export async function transcribeAudio(audioPath: string): Promise<string> {
    try {
        console.log(`🎤 Transcribiendo audio: ${audioPath}`);
        
        // Usamos Groq para Whisper si está disponible, es compatible con el SDK de OpenAI
        const groq = new OpenAI({
            apiKey: env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1"
        });

        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: "whisper-large-v3-turbo",
        });

        return transcription.text;
    } catch (e: any) {
        console.error("❌ Error en STT (Whisper):", e.message);
        return "";
    }
}

/**
 * Convierte texto a audio (MP3) usando OpenAI TTS.
 * Requiere una clave de OpenAI válida en env.OPENAI_API_KEY.
 */
export async function generateVoice(text: string, outputPath: string): Promise<boolean> {
    try {
        let apiKey = env.OPENAI_API_KEY;
        let baseURL = undefined;
        let model = "tts-1";

        if (!apiKey && env.OPENROUTER_API_KEY) {
            console.log("🌐 Usando OpenRouter para TTS...");
            apiKey = env.OPENROUTER_API_KEY;
            baseURL = "https://openrouter.ai/api/v1";
            model = "openai/tts-1";
        }

        if (!apiKey) {
            console.warn("⚠️ No se encontró clave para TTS (OpenAI o OpenRouter).");
            return false;
        }

        console.log(`🔊 Generando voz [${model}] para: ${text.substring(0, 50)}...`);
        const openai = new OpenAI({ apiKey, baseURL });

        const mp3 = await openai.audio.speech.create({
            model: model as any,
            voice: "shimmer", 
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        await fs.writeFile(outputPath, buffer);
        return true;
    } catch (e: any) {
        console.error("❌ Error en TTS:", e.message);
        return false;
    }
}
