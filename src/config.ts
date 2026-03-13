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
});

const parseResult = configSchema.safeParse(process.env);

if (!parseResult.success) {
    console.warn("⚠️ Advertencia: Algunas variables de entorno faltan o son incorrectas:");
    for (const error of parseResult.error.issues) {
        console.warn(`- ${error.path.join(".")}: ${error.message}`);
    }
    // No salimos con error 1 aquí si tenemos lo mínimo para funcionar (Token + Groq)
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.GROQ_API_KEY) {
        console.error("❌ ERROR CRÍTICO: Faltas variables esenciales (TELEGRAM_BOT_TOKEN o GROQ_API_KEY). El bot no puede iniciar.");
        process.exit(1);
    }
}

export const env = parseResult.success 
    ? parseResult.data 
    : {
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
        TELEGRAM_VIP_GROUP_ID: process.env.TELEGRAM_VIP_GROUP_ID || "",
        GROQ_API_KEY: process.env.GROQ_API_KEY || "",
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
        OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "openrouter/free",
        FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "firebase-key.json",
        FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    };

// Whitelist opcional (si no se provee, no se usa)
const rawAllowedIds = process.env.TELEGRAM_ALLOWED_USER_IDS || "";
export const allowedUserIds = rawAllowedIds.split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id));
