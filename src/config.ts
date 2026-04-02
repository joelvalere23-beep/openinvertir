import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// En la nube (Railway), algunas variables pueden pasarse de forma distinta.
// Hacemos el esquema más flexible para evitar que el bot se detenga por variables opcionales.
const configSchema = z.object({
    TELEGRAM_BOT_TOKEN: z.string().min(1, "El token del bot de Telegram es obligatorio"),
    TELEGRAM_VIP_GROUP_ID: z.string().default(""), // Opcional para arranque básico
    GROQ_API_KEY: z.string().min(1, "La clave de API de Groq es obligatoria"),
    OPENROUTER_API_KEY: z.string().optional(),
    OPENROUTER_MODEL: z.string().default("openrouter/free"),
    FIREBASE_SERVICE_ACCOUNT_PATH: z.string().default("firebase-key.json"),
    FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
    // Nuevo: JSON con configuración de múltiples bots para B2B
    // Formato esperado: '[{"name":"Empresa 1","token":"TOKEN1","persona":"Eres el bot de 1..."}]'
    TENANTS_JSON: z.string().default("[]"),
    // OAuth Ops
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    MS_CLIENT_ID: z.string().optional(),
    MS_CLIENT_SECRET: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    OLLAMA_API_KEY: z.string().optional(),
    OLLAMA_BASE_URL: z.string().default("https://api.studio.nebius.ai/v1"),
    OLLAMA_MODEL: z.string().default("meta-llama/Meta-Llama-3.1-70B-Instruct"),
    IMAGE_GEN_API_KEY: z.string().optional(),
    IMAGE_GEN_BASE_URL: z.string().optional(),
    IMAGE_GEN_MODEL: z.string().default("gpt-image-1.5"),
    MAMMOUTH_API_KEY: z.string().optional(),
});


const parseResult = configSchema.safeParse(process.env);

if (!parseResult.success) {
    console.warn("⚠️ Advertencia: Algunas variables de entorno faltan o son incorrectas:");
    for (const error of parseResult.error.issues) {
        console.warn(`- ${error.path.join(".")}: ${error.message}`);
    }
    // No salimos con error 1 aquí si tenemos lo mínimo para funcionar (Token + Groq)
    if (!process.env.TELEGRAM_BOT_TOKEN && !process.env.TENANTS_JSON) {
        console.error("❌ ERROR CRÍTICO: Faltas variables esenciales (BOT_TOKEN o TENANTS_JSON).");
        process.exit(1);
    }
}

export const env = parseResult.success 
    ? { ...parseResult.data, IMAGE_GEN_API_KEY: process.env.IMAGE_GEN_API_KEY } 
    : {

        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
        TELEGRAM_VIP_GROUP_ID: process.env.TELEGRAM_VIP_GROUP_ID || "",
        GROQ_API_KEY: process.env.GROQ_API_KEY || "",
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
        OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "openrouter/free",
        FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "firebase-key.json",
        FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
        TENANTS_JSON: process.env.TENANTS_JSON || "[]",
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        MS_CLIENT_ID: process.env.MS_CLIENT_ID,
        MS_CLIENT_SECRET: process.env.MS_CLIENT_SECRET,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        OLLAMA_API_KEY: process.env.OLLAMA_API_KEY,
        OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || "https://api.studio.nebius.ai/v1",
        OLLAMA_MODEL: process.env.OLLAMA_MODEL || "meta-llama/Meta-Llama-3.1-70B-Instruct",
        IMAGE_GEN_API_KEY: process.env.IMAGE_GEN_API_KEY,
        IMAGE_GEN_BASE_URL: process.env.IMAGE_GEN_BASE_URL,
        IMAGE_GEN_MODEL: process.env.IMAGE_GEN_MODEL || "gpt-image-1.5",
        MAMMOUTH_API_KEY: process.env.MAMMOUTH_API_KEY,
    };


// Procesar tenants
export interface TenantConfig {
    id: string;
    name: string;
    token: string;
    persona?: string;
}

let tenants: TenantConfig[] = [];
try {
    tenants = JSON.parse(env.TENANTS_JSON);
} catch (e) {
    console.warn("⚠️ Error al parsear TENANTS_JSON, usando bot por defecto.");
}

// Si hay un token individual, lo añadimos como el tenant principal
if (env.TELEGRAM_BOT_TOKEN) {
    tenants.push({
        id: "main",
        name: "OpenInvertit Main",
        token: env.TELEGRAM_BOT_TOKEN
    });
}

export { tenants };

// Whitelist opcional (si no se provee, no se usa)
const rawAllowedIds = process.env.TELEGRAM_ALLOWED_USER_IDS || "";
export const allowedUserIds = rawAllowedIds.split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id));
