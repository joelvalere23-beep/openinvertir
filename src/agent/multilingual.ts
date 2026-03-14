import { env } from "../config.js";

/**
 * Módulo para gestionar la elocuencia y el idioma del Agente.
 * Asegura que el bot mantenga el tono profesional en cualquier lengua.
 */
export async function detectLanguageAndStyle(text: string): Promise<string> {
    // El LLM ya lo hace bastante bien por sí solo si se le instruye en el SYSTEM_PROMPT.
    // Pero aquí podemos añadir lógica extra si fuera necesario (ej. traducción forzada).
    return "auto"; 
}

export const MULTILINGUAL_INSTRUCTION = `
REGLA DE ORO DE IDIOMA:
Detecta el idioma del usuario y responde EXACTAMENTE en ese mismo idioma. 
Si el usuario habla en inglés, responde en inglés profesional. 
Si habla en español, mantén la elocuencia dominicana sofisticada.
NUNCA mezcles idiomas a menos que sea necesario para términos técnicos inmobiliarios.
`;
