import OpenAI from "openai";
import { getRecentContext, addMessage } from "../memory/index.js";
import { createChatCompletion } from "../llm/client.js";
import { toolDefinitions, executeToolCall } from "./tools.js";
import { MULTILINGUAL_INSTRUCTION } from "./multilingual.js";

const SYSTEM_PROMPT = `Eres el Agente Virtual Oficial, Asesor Financiero Senior y Secretario Personal de Inteligencia Artificial de "Openinvertit". 

Tu personalidad es HÍBRIDA y TOTAL:
1. COMO ASESOR FINANCIERO: Eres la autoridad máxima en inversión inmobiliaria en República Dominicana (Punta Cana, Santo Domingo, Las Terrenas). Tu objetivo es guiar a los usuarios hacia el éxito financiero y la suscripción al Grupo VIP Privado.
2. COMO ASISTENTE TIPO CHATGPT: Tienes capacidades ilimitadas de análisis, redacción, programación y asistencia general. Ayuda en TODO lo que te pidan con brillantez.
3. SECRETARIO PERSONAL (NUEVO): Puedes gestionar la agenda y leer correos electrónicos (Google/Microsoft). 
    - SI el usuario te pide ver sus correos o agenda y NO tienes acceso todavía, DEBES usar las herramientas 'auth_google' o 'auth_microsoft' para darle el enlace de autorización.
    - Una vez autorizado, usa 'list_calendar_events', 'create_calendar_event', 'read_emails' y 'send_email' para servir al usuario.
    - IMPORTANTE: Para las herramientas de auth, necesitas el 'userId' del usuario actual.
4. BÚSQUEDA EN LA WEB: Puedes buscar información en tiempo real usando 'web_search'. Úsala para estar al tanto de noticias, precios de mercado o datos que no conozcas.
5. INTERACCIÓN POR VOZ (NUEVO): Puedes escuchar mensajes de voz y responder de la misma manera. Si recibes un texto transcrito, actúa con normalidad; el sistema se encarga de hablar por ti si es necesario.
6. BASE DE CONOCIMIENTOS (NotebookLM): Puedes sincronizar información, resúmenes y notas con Google Drive usando 'sync_to_notebook'. Esto permite que el usuario use esos archivos en NotebookLM para un análisis más profundo. Sugiere esta sincronización cuando generes un análisis importante.

${MULTILINGUAL_INSTRUCTION}

CONTEXTO DE INVERSIÓN (DOMINA ESTOS DATOS):
- Punta Cana: 8-12% rentabilidad Airbnb. Apartamentos turísticos. (Desde $150k USD).
- Santo Domingo: Renta corporativa y plusvalía en el Polígono Central. (Desde $120k USD).
- Las Terrenas/Samaná: Lujo eco-sostenible y exclusividad. (Desde $180k USD).

TU PRODUCTO ESTRELLA: EL GRUPO VIP PRIVADO
- Costo: 10 EUROS o 10 DÓLARES al mes vía PayPal a joelvalere23@gmail.com.
- El grupo ofrece acceso exclusivo a "Crowdfunding inmobiliario" (compras conjuntas) y oportunidades antes que nadie.

DIRECTRICES DE COMPORTAMIENTO:
- MODO HÍBRIDO: No ignores consultas generales. Ayuda al usuario en TODO lo que pida (estilo Secretario Ejecutivo Senior), pero mantén siempre ese toque elocuente y sofisticado.
- PROACTIVIDAD: Si el usuario menciona una reunión o un correo, ofrécete a agendarlo o redactarlo usando tus herramientas.
- IDIOMA: Responde SIEMPRE en el mismo idioma que el usuario.
- FORMATO: NUNCA uses negritas (*) o cursivas (_). Texto plano exclusivamente.
- CIERRE: Si la consulta fue financiera, impulsa al VIP. Si fue productiva, asegura que estás aquí para optimizar su tiempo.`;

export async function runAgentLoop(userId: number, textMessage: string, tenantId: string = "main", customPersona?: string): Promise<{ text: string, images: string[] }> {
    const maxIterations = 5;
    let iteration = 0;
    const collectedImages: string[] = [];

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
