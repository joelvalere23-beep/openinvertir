import OpenAI from "openai";
import { env } from "../config.js";

// Inicializamos el cliente OpenAI para que apunte a OpenRouter o Groq
// En este caso, usaremos OpenRouter por defecto porque el usuario lo especificó. 
// Si se prefiere usar la key de Groq directamente, se puede cambiar la baseURL a "https://api.groq.com/openai/v1"

const openai = new OpenAI({
    apiKey: env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

/**
 * Función central para llamadas al LLM
 */
export async function createChatCompletion(messages: OpenAI.Chat.ChatCompletionMessageParam[], tools?: OpenAI.Chat.ChatCompletionTool[]) {
    return await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        tools: tools && tools.length > 0 ? tools : undefined,
        tool_choice: tools && tools.length > 0 ? "auto" : "none",
        temperature: 0.7,
    });
}
