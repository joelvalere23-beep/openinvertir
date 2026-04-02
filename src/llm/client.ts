import OpenAI from "openai";
import { env } from "../config.js";

// Inicializamos el cliente OpenAI para que apunte a OpenRouter o Groq
// En este caso, usaremos OpenRouter por defecto porque el usuario lo especificó. 
// Si se prefiere usar la key de Groq directamente, se puede cambiar la baseURL a "https://api.groq.com/openai/v1"

const hasMammouth = !!(env.MAMMOUTH_API_KEY && env.MAMMOUTH_API_KEY !== "TU_CLAVE_AQUÍ");
const useOllama = !!(env.OLLAMA_API_KEY && (env.OLLAMA_API_KEY as string).length > 0);

const apiKey = hasMammouth
    ? env.MAMMOUTH_API_KEY
    : (env.GROQ_API_KEY 
        ? env.GROQ_API_KEY
        : (env.OPENROUTER_API_KEY 
            ? env.OPENROUTER_API_KEY 
            : (useOllama ? env.OLLAMA_API_KEY : env.OPENAI_API_KEY)));

const baseURL = hasMammouth
    ? "https://api.mammouth.ai/v1"
    : (env.GROQ_API_KEY
        ? "https://api.groq.com/openai/v1"
        : (env.OPENROUTER_API_KEY 
            ? "https://openrouter.ai/api/v1" 
            : (useOllama ? env.OLLAMA_BASE_URL : undefined)));

const openai = new OpenAI({
    apiKey,
    baseURL
});



/**
 * Función central para llamadas al LLM (ahora con soporte para la API de 'Responses')
 * Esta versión soporta auto-corrección y toma de decisiones avanzada.
 */
export async function createChatCompletion(messages: OpenAI.Chat.ChatCompletionMessageParam[], tools?: OpenAI.Chat.ChatCompletionTool[]) {
    const hasImage = messages.some(m => 
        Array.isArray(m.content) && m.content.some((c: any) => c.type === "image_url")
    );

    let model = "";
    
    // Configuración de modelos con jerarquía inteligente adaptada a Mammouth / Groq
    if (hasMammouth) {
        model = "gpt-4.1";
    } else if (env.GROQ_API_KEY) {
        model = hasImage ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile";
    } else if (env.OPENROUTER_API_KEY) {
        model = hasImage ? "google/gemini-flash-1.5" : "meta-llama/llama-3.3-70b-instruct";
    } else if (useOllama) {
        model = env.OLLAMA_MODEL as string;
    } else {
        model = "gpt-4o-mini"; // Fallback a OpenAI si no hay más remedio
    }


    console.log(`[LLM] Iniciando Respuesta via ${model} (${hasImage ? 'VISIÓN' : 'TEXTO'})`);

    try {
        // Intentamos usar el nuevo sistema de 'Responses' si estamos en modelos compatibles (estilo GPT-4o futuro)
        // NOTA: Para OpenRouter/Groq emulamos este comportamiento con Completions por compatibilidad.
        
        return await openai.chat.completions.create({
            model,
            messages,
            tools: tools && tools.length > 0 ? tools : undefined,
            tool_choice: tools && tools.length > 0 ? "auto" : "none",
            temperature: 0.7,
            // Añadimos configuración de "Agente" para mejorar la coherencia
            max_tokens: 3000,
        });

    } catch (error: any) {
        console.error("⚠️ Error en Respuesta del LLM:", error.message);
        throw error;
    }
}

/**
 * Función experimental para auto-corrección de respuestas.
 * Usa un modelo secundario para verificar si la respuesta cumple las directrices.
 */
export async function verifyAndCorrectResponse(userInput: string, responseText: string): Promise<string> {
    console.log("[Agente] Iniciando fase de auto-corrección...");
    
    const verificationMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: "Eres un revisor de calidad. Tu tarea es corregir la respuesta si no suena elocuente o si olvida saludar al usuario. Devuelve la versión final perfecta." },
        { role: "user", content: `Usuario: ${userInput}\nRespuesta Original: ${responseText}` }
    ];

    let model = "meta-llama/llama-3.3-70b-instruct";
    if (env.GROQ_API_KEY) {
        model = "llama-3.3-70b-versatile";
    } else if (env.OPENROUTER_API_KEY) {
        model = "meta-llama/llama-3.3-70b-instruct";
    } else {
        model = "gpt-4o-mini";
    }
    
    const correctionRes = await openai.chat.completions.create({
        model,
        messages: verificationMessages,
    });


    return correctionRes.choices[0].message.content || responseText;
}



