import axios from "axios";
import { env } from "../config.js";
import fs from "fs-extra";
import path from "path";
import FormData from "form-data";
import { fileURLToPath } from "url";

// Permite simular __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createVoice() {
    // 1. Configuración de API
    const apiKey = env.OPENAI_API_KEY; // O tu API Key genérica dependiendo del proveedor
    const baseUrl = "https://api.openai.com/v1/audio/voices"; // Cambiar por IMAGE_GEN_BASE_URL/audio/voices si es un proxy

    if (!apiKey) {
        console.error("❌ ERROR: No tienes una OPENAI_API_KEY definida en tu .env");
        process.exit(1);
    }

    // 2. Ruta de tus archivos de audio
    // Pon tu archivo de prueba "mi_voz.wav" en la misma carpeta raíz (Desktop/nuevo proyecto 2)
    const rootDir = path.join(__dirname, "../../");
    const audioPath = path.join(rootDir, "audio_sample.wav"); 
    
    // Aquí pon el ID de consentimiento o la frase que exija el proveedor
    const consentId = "cons_1234";

    if (!fs.existsSync(audioPath)) {
        console.error(`❌ ERROR: No se encontró el archivo de audio base en: ${audioPath}`);
        console.log("👉 Debes guardar un audio corto tuyo llamado 'audio_sample.wav' en la carpeta principal del proyecto.");
        process.exit(1);
    }

    console.log("🚀 Subiendo y procesando nueva voz personalizada...");

    try {
        // 3. Crear el formulario igual que el '-F' de cURL
        const formData = new FormData();
        formData.append("name", "Voz de Ian Personalizada");
        formData.append("consent", consentId);
        formData.append("audio_sample", fs.createReadStream(audioPath));

        // 4. Enviar a la API
        const response = await axios.post(baseUrl, formData, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                ...formData.getHeaders(),
            },
        });

        // 5. El Servicio te devuelve el ID de tú nueva voz
        console.log("✅ ¡Voz creada exitosamente!");
        console.log("==========================================");
        console.log("VOICE ID RESULTANTE:", response.data.id || response.data.voice_id || response.data);
        console.log("==========================================");
        
        console.log("\n💬 ¡Genial! Ahora ve a 'src/utils/audio.ts' y cambia 'shimmer' por este ID devuelto.");

    } catch (error: any) {
        console.error("❌ Ocurrió un error al crear la voz:");
        if (error.response) {
            console.error("Mensaje del servidor:", error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

// Ejecutar
createVoice();
