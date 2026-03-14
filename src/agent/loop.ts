import OpenAI from "openai";
import { getRecentContext, addMessage } from "../memory/index.js";
import { createChatCompletion } from "../llm/client.js";
import { toolDefinitions, executeToolCall } from "./tools.js";
import { MULTILINGUAL_INSTRUCTION } from "./multilingual.js";

const SYSTEM_PROMPT = `Eres el Agente Virtual Oficial, Asesor Financiero Senior y Asistente de Inteligencia Artificial Avanzada de "Openinvertit". 

Tu personalidad es HÍBRIDA:
1. COMO ASESOR FINANCIERO: Eres la autoridad máxima en inversión inmobiliaria en República Dominicana (Punta Cana, Santo Domingo, Las Terrenas). Tu objetivo es guiar a los usuarios hacia el éxito financiero y la suscripción al Grupo VIP Privado.
10. 2. COMO ASISTENTE TIPO CHATGPT: Tienes capacidades ilimitadas de análisis, resolución de problemas, desglose de aplicaciones, redacción, programación y asistencia general. Si un usuario te pide algo no relacionado con bienes raíces (como analizar un código, resumir un texto o planear una estrategia), debes responder con la misma brillantez y profundidad que un modelo GPT avanzado, sin perder tu identidad profesional.
11. 3. SUPERPODER DE GENERACIÓN DE IMÁGENES: Ahora tienes la capacidad de crear imágenes asombrosas bajo demanda (tipo Midjourney/DALL-E). Si el usuario te pide una imagen o un diseño, usa tu herramienta de generación de imágenes.

${MULTILINGUAL_INSTRUCTION}

13: CONTEXTO DE INVERSIÓN (DOMINA ESTOS DATOS):
14: - Punta Cana: 8-12% rentabilidad Airbnb. Apartamentos turísticos. (Desde $150k USD).
15: - Santo Domingo: Renta corporativa y plusvalía en el Polígono Central. (Desde $120k USD).
16: - Las Terrenas/Samaná: Lujo eco-sostenible y exclusividad. (Desde $180k USD).
17: 
18: TU PRODUCTO ESTRELA: EL GRUPO VIP PRIVADO
19: - Costo: 10 EUROS o 10 DÓLARES al mes vía PayPal a joelvalere23@gmail.com.
20: - El grupo ofrece acceso exclusivo a "Crowdfunding inmobiliario" (compras conjuntas) y oportunidades antes que nadie.
21: 
22: DIRECTRICES DE COMPORTAMIENTO:
23: - MODO HÍBRIDO: No ignores consultas generales. Ayuda al usuario en TODO lo que pida (estilo ChatGPT), pero mantén siempre ese toque elocuente y sofisticado de Openinvertit.
24: - IMÁGENES: Si generas una imagen, confirma siempre que la estás creando y menciona que eres capaz de visualizar sus sueños o ideas.
25: - IDIOMA: Responde SIEMPRE en el mismo idioma que el usuario.
26: - FORMATO: NUNCA uses negritas (*), cursivas (_) o Markdown. Texto plano exclusivamente.
27: - CIERRE: Si la consulta fue financiera, impulsa al VIP. Si fue general, termina con una frase profesional que refuerce tu utilidad total como asistente inteligente.`;

export async function runAgentLoop(userId: number, textMessage: string, tenantId: string = "main", customPersona?: string): Promise<string> {
    const maxIterations = 5;
    let iteration = 0;

    const persona = customPersona || SYSTEM_PROMPT;

    // 1. Añadimos el mensaje del usuario a la DB
    await addMessage({
        user_id: userId,
        role: "user",
        content: textMessage
    }, tenantId);

    // 2. Extraemos el contexto reciente de la BD
    const recentMessages = await getRecentContext(userId, tenantId, 15);

    // Convertimos al formato OpenAI
    const messageHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: persona },
        ...recentMessages.map((msg: any) => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content
        } as OpenAI.Chat.ChatCompletionMessageParam))
    ];

    let finalResponse = "";

    // Bucle principal de pensamiento / tool execution
    while (iteration < maxIterations) {
        iteration++;

        console.log(`[Agente Iteración ${iteration}] Llamando al LLM...`);
        const response = await createChatCompletion(messageHistory, toolDefinitions);
        const choice = response.choices[0];
        const message = choice.message;

        // Añadimos la respuesta del asistente al historial en memoria (temporal del bucle)
        messageHistory.push(message);

        // Si el modelo quiere ejecutar una herramienta
        if (message.tool_calls && message.tool_calls.length > 0) {
            console.log(`[Agente Iteración ${iteration}] El LLM llamó a herramientas:`, message.tool_calls.map(t => t.function.name));

            for (const toolCall of message.tool_calls) {
                // Ejecutamos la herramienta pasando el tenantId
                const toolResult = await executeToolCall(toolCall, tenantId);

                // Devolvemos el resultado al LLM
                messageHistory.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: toolResult
                });
            }
        }
        // Si el modelo responde con texto y no llama herramientas, terminamos
        else if (message.content) {
            finalResponse = message.content;
            break;
        } else {
            // Caso raro: si no hay tools ni content, terminamos
            finalResponse = "Ocurrió un error inesperado al generar mi respuesta.";
            break;
        }
    }

    if (iteration >= maxIterations && !finalResponse) {
        finalResponse = "Lo siento, alcancé mi límite de iteraciones pensando. Intentemos de nuevo.";
    }

    // 3. Guardamos la respuesta final en la BD
    await addMessage({
        user_id: userId,
        role: "assistant",
        content: finalResponse
    }, tenantId);

    return finalResponse;
}
