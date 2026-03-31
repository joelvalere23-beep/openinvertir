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
        
        let apiKey = env.OPENAI_API_KEY;
        if (!apiKey && env.GROQ_API_KEY) apiKey = env.GROQ_API_KEY; // Fallback opcional

        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: env.IMAGE_GEN_BASE_URL || undefined 
        });

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: "gpt-4o-transcribe",
        });

        return transcription.text;
    } catch (e: any) {
        console.error("❌ Error en STT (Whisper):", e.message);
        return "";
    }
}

/**
 * Traduce un archivo de audio (en cualquier idioma) a texto en Inglés.
 * Requisito basado en /v1/audio/translations con el modelo whisper-1.
 */
export async function translateAudio(audioPath: string): Promise<string> {
    try {
        console.log(`🌍 Módulo de Traducción Whisper activado para: ${audioPath}`);
        
        let apiKey = env.OPENAI_API_KEY;
        if (!apiKey && env.GROQ_API_KEY) apiKey = env.GROQ_API_KEY; // Fallback por si usan groq

        const openai = new OpenAI({
            apiKey: apiKey,
            // Si el motor es OpenAI oficial, no hace falta baseURL
            baseURL: env.IMAGE_GEN_BASE_URL || undefined 
        });

        // Este endpoint siempre traduce al Inglés (comportamiento de la API oficial)
        const translation = await openai.audio.translations.create({
            file: fs.createReadStream(audioPath),
            model: "whisper-1",
        });

        return translation.text;
    } catch (e: any) {
        console.error("❌ Error en Traducción de Audio (Whisper):", e.message);
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
        let baseURL = undefined; // Dejará que use la API estándar, o puedes cambiarlo aquí por el de tu proveedor
        let model = "tts-1-hd"; // Usamos HD para máxima calidad
        let targetVoice = "nova"; // Voz más suave y conversacional, ideal para el estilo VibeVoice de Microsoft.

        if (!apiKey && env.OPENROUTER_API_KEY) {
            console.log("🌐 Usando OpenRouter para TTS...");
            apiKey = env.OPENROUTER_API_KEY;
            baseURL = "https://openrouter.ai/api/v1";
            model = "openai/tts-1";
        }

        if (!apiKey) {
            console.warn("⚠️ No se encontró clave para TTS.");
            return false;
        }

        console.log(`🔊 Generando voz [${model}] para: ${text.substring(0, 50)}...`);
        const openai = new OpenAI({ apiKey, baseURL });

        const mp3 = await openai.audio.speech.create({
            model: model as any,
            voice: targetVoice as any, 
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
