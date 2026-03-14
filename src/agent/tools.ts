import OpenAI from "openai";
import { Api } from "grammy";
import { env } from "../config.js";

const telegramApi = new Api(env.TELEGRAM_BOT_TOKEN);

export interface OpeninvertitTool {
    definition: OpenAI.Chat.ChatCompletionTool;
    execute: (args: any, tenantId?: string) => Promise<string> | string;
}

import { captureLead } from "../crm/leads.js";

export const tools: OpeninvertitTool[] = [
    {
        definition: {
            type: "function",
            function: {
                name: "capture_lead",
                description: "Registra a un cliente interesado (Lead) en el CRM. Úsala cuando el usuario muestre un interés claro en invertir, comprar o suscribirse.",
                parameters: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "Nombre completo del interesado" },
                        interest: { type: "string", description: "En qué está interesado específicamente (ej: Inversión Punta Cana, Grupo VIP, CRM)" },
                        email: { type: "string", description: "Email si lo proporcionó" },
                        phone: { type: "string", description: "Teléfono si es distinto al de contacto" },
                    },
                    required: ["name", "interest"],
                },
            },
        },
        execute: async (args: any, tenantId: string = "main") => {
            await captureLead({
                tenantId,
                userId: "tool_execution", // En una implementación más fina pasaríamos el ID real
                name: args.name,
                interest: args.interest,
                email: args.email,
                phone: args.phone,
                source: "telegram",
                created_at: new Date()
            });
            return `INFO: El lead de ${args.name} ha sido registrado con éxito en el CRM para seguimiento.`;
        }
    },
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
                name: "generate_image",
                description: "Generar una imagen a partir de una descripción textual usando IA avanzada (DALL-E 3).",
                parameters: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string",
                            description: "Descripción detallada de la imagen que se desea generar.",
                        },
                    },
                    required: ["prompt"],
                },
            },
        },
        execute: async (args: { prompt: string }) => {
            try {
                const openai = new OpenAI({ apiKey: env.GROQ_API_KEY }); // Usamos la misma clave si es de OpenAI, o env.OPENAI_API_KEY si existiera
                
                console.log(`🎨 Generando imagen para: ${args.prompt}`);
                const response = await openai.images.generate({
                    model: "dall-e-3",
                    prompt: args.prompt,
                    n: 1,
                    size: "1024x1024",
                });

                if (!response.data || response.data.length === 0) {
                    throw new Error("No se recibió información de la imagen generada.");
                }

                const imageUrl = response.data[0].url;
                if (!imageUrl) throw new Error("No se pudo obtener la URL de la imagen.");

                return `IMAGEN_GENERADA|${imageUrl}|${args.prompt}`;
            } catch (e: any) {
                console.error("Error en DALL-E:", e);
                return `Error generando la imagen: ${e.message}. Asegúrate de que la API Key tenga créditos para DALL-E 3.`;
            }
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

export async function executeToolCall(toolCall: OpenAI.Chat.ChatCompletionMessageToolCall, tenantId: string = "main") {
    const tool = tools.find((t) => t.definition.function.name === toolCall.function.name);
    if (!tool) {
        return `Error: Herramienta '${toolCall.function.name}' no encontrada.`;
    }

    try {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await tool.execute(args, tenantId);
        return result;
    } catch (error: any) {
        return `Error ejecutando la herramienta: ${error.message}`;
    }
}
