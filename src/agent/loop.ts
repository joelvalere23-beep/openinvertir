import OpenAI from "openai";
import { getRecentContext, addMessage } from "../memory/index.js";
import { createChatCompletion, verifyAndCorrectResponse } from "../llm/client.js";
import { toolDefinitions, executeToolCall } from "./tools.js";
import { loadSkills } from "../skills/SkillManager.js";
import { MULTILINGUAL_INSTRUCTION } from "./multilingual.js";

export async function runAgentLoop(userId: number, textMessage: string, tenantId: string = "main", customPersona?: string, imageUrl?: string): Promise<{ text: string, images: string[] }> {
    const maxIterations = 5;
    let iteration = 0;
    const collectedImages: string[] = [];

    // Load dynamic skills
    const basePersona = await loadSkills();
    const persona = customPersona || `${basePersona}\n\n${MULTILINGUAL_INSTRUCTION}`;

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

    // Si hay una imagen actual, la añadimos al ÚLTIMO mensaje en el historial temporal de este bucle
    if (imageUrl) {
        const lastMessage = messageHistory[messageHistory.length - 1];
        if (lastMessage.role === "user") {
            lastMessage.content = [
                { type: "text", text: String(lastMessage.content) },
                { type: "image_url", image_url: { url: imageUrl } }
            ];
        }
    }


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
                // Ejecutamos la herramienta pasando el tenantId y el userId
                const toolExecution = await executeToolCall(toolCall, tenantId, userId);
                
                if (toolExecution.image) {
                    collectedImages.push(toolExecution.image);
                }

                // Devolvemos el resultado al LLM
                messageHistory.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: toolExecution.result
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

    // 🎨 AUTO-CORRECCIÓN (NUEVO): Basado en tu sugerencia de la API de Responses de nueva generación
    // Verificamos si la respuesta es óptima antes de enviarla
    if (finalResponse) {
        finalResponse = await verifyAndCorrectResponse(textMessage, finalResponse);
    }

    // 3. Guardamos la respuesta final en la BD
    await addMessage({
        user_id: userId,
        role: "assistant",
        content: finalResponse
    }, tenantId);

    return {
        text: finalResponse,
        images: collectedImages
    };
}

