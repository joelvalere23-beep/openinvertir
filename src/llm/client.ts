import OpenAI from "openai";
import { env } from "../config.js";

// Inicializamos el cliente OpenAI para que apunte a OpenRouter o Groq
// En este caso, usaremos OpenRouter por defecto porque el usuario lo especificó. 
// Si se prefiere usar la key de Groq directamente, se puede cambiar la baseURL a "https://api.groq.com/openai/v1"

const useOllama = !!(env.OLLAMA_API_KEY && (env.OLLAMA_API_KEY as string).length > 0);

const openai = new OpenAI({
    apiKey: useOllama ? env.OLLAMA_API_KEY : env.GROQ_API_KEY,
    baseURL: useOllama ? env.OLLAMA_BASE_URL : "https://api.groq.com/openai/v1"
});

/**
 * Función central para llamadas al LLM
 */
export async function createChatCompletion(messages: OpenAI.Chat.ChatCompletionMessageParam[], tools?: OpenAI.Chat.ChatCompletionTool[]) {
    const model = useOllama ? env.OLLAMA_MODEL : "llama-3.3-70b-versatile";
    
    console.log(`[LLM] Usando modelo: ${model} en ${useOllama ? 'Nebius/Ollama' : 'Groq'}`);
    
    return await openai.chat.completions.create({
        model: model as string,
        messages,
        tools: tools && tools.length > 0 ? tools : undefined,
        tool_choice: tools && tools.length > 0 ? "auto" : "none",
        temperature: 0.7,
    });
}
