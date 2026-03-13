import OpenAI from "openai";
import { Api } from "grammy";
import { env } from "../config.js";

const telegramApi = new Api(env.TELEGRAM_BOT_TOKEN);

export interface OpeninvertitTool {
    definition: OpenAI.Chat.ChatCompletionTool;
    execute: (args: any) => Promise<string> | string;
}

// Implementación de herramientas básicas locales para comprobar ejecución
export const tools: OpeninvertitTool[] = [
    {
        definition: {
            type: "function",
            function: {
                name: "get_current_time",
                description: "Obtener la fecha y hora actual local del servidor",
                parameters: {
                    type: "object",
                    properties: {},
                },
            },
        },
        execute: () => {
            const now = new Date();
            return `La fecha y hora actuales son: ${now.toLocaleString("es-ES")}`;
        },
    },
    {
        definition: {
            type: "function",
            function: {
                name: "list_allowed_users",
                description: "Devuelve información de los usuarios registrados y permitidos en este bot.",
                parameters: {
                    type: "object",
                    properties: {},
                },
            },
        },
        execute: () => {
            // En una app real consultaríamos la DB, pero como prueba leeremos config env
            return `Los únicos que pueden hablar conmigo son los usuarios cuyos IDs aparezcan en la whitelist proporcionada por sistema. Soy completamente privado y seguro.`;
        }
    },
    {
        definition: {
            type: "function",
            function: {
                name: "generate_vip_invite",
                description: "Genera un enlace de invitación temporal de un solo uso para el grupo VIP privado de inversores. Usa esta herramienta SOLAMENTE cuando el inversor haya confirmado explícitamente el pago exitoso.",
                parameters: {
                    type: "object",
                    properties: {},
                },
            },
        },
        execute: async () => {
            try {
                // NOTA PARA EL USUARIO: Para que esto funcione, debes poner el ID real del Grupo Privado y meter al bot de Admin allí.
                // Para la demo, el bot dirá el siguiente texto:
                return `INFO DEL SISTEMA: Enlace VIP generado con éxito. Envíale este enlace al usuario final: https://t.me/+FalsoEnlaceDeDemoVIP123`;

                // CÓDIGO REAL A FUTURO:
                // const invite = await telegramApi.createChatInviteLink(-1000000000000, { member_limit: 1 });
                // return `Enlace generado con éxito: ${invite.invite_link}`;
            } catch (e: any) {
                return `Simulación de error generando enlace: ${e.message}`;
            }
        }
    }
];

export const toolDefinitions = tools.map((t) => t.definition);

export async function executeToolCall(toolCall: OpenAI.Chat.ChatCompletionMessageToolCall) {
    const tool = tools.find((t) => t.definition.function.name === toolCall.function.name);
    if (!tool) {
        return `Error: Herramienta '${toolCall.function.name}' no encontrada.`;
    }

    try {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await tool.execute(args);
        return result;
    } catch (error: any) {
        return `Error ejecutando la herramienta: ${error.message}`;
    }
}
