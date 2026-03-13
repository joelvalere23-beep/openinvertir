import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const configSchema = z.object({
    TELEGRAM_BOT_TOKEN: z.string().min(1, "El token del bot de Telegram es obligatorio"),
    TELEGRAM_ALLOWED_USER_IDS: z.string().min(1, "Debe haber al menos un ID de usuario permitido"),
    TELEGRAM_VIP_GROUP_ID: z.string().min(1, "El ID del grupo VIP es obligatorio"),
    GROQ_API_KEY: z.string().min(1, "La clave de API de Groq es obligatoria"),
    OPENROUTER_API_KEY: z.string().min(1, "La clave de API de OpenRouter es obligatoria"),
    OPENROUTER_MODEL: z.string().default("openrouter/free"),
    FIREBASE_SERVICE_ACCOUNT_PATH: z.string().min(1, "La ruta de la cuenta de servicio de Firebase es obligatoria"),
});

const _config = configSchema.safeParse(process.env);

if (!_config.success) {
    console.error("❌ Archivo .env incompleto o incorrecto:");
    for (const error of _config.error.issues) {
        console.error(`- ${error.path.join(".")}: ${error.message}`);
    }
    process.exit(1);
}

export const env = _config.data;
export const allowedUserIds = env.TELEGRAM_ALLOWED_USER_IDS.split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id));
