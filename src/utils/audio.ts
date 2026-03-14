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
        if (!env.OPENAI_API_KEY) {
            console.warn("⚠️ No se encontró OPENAI_API_KEY. El bot responderá solo con texto.");
            return false;
        }

        console.log(`🔊 Generando voz para: ${text.substring(0, 50)}...`);
        const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "shimmer", // Voz profesional y elocuente
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
