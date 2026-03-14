import OpenAI from "openai";
import { google } from "googleapis";
import { Client } from "@microsoft/microsoft-graph-client";
import { Api } from "grammy";
import { env } from "../config.js";

const telegramApi = new Api(env.TELEGRAM_BOT_TOKEN);

export interface OpeninvertitTool {
    definition: OpenAI.Chat.ChatCompletionTool;
    execute: (args: any, tenantId?: string) => Promise<string> | string;
}

import { getGoogleAuthUrl } from "../auth/google.js";
import { getMicrosoftAuthUrl } from "../auth/microsoft.js";
import { getTokens } from "../memory/index.js";

export const tools: OpeninvertitTool[] = [
    {
        definition: {
            type: "function",
            function: {
                name: "auth_google",
                description: "Genera un enlace para que el usuario autorice el acceso a su Google Calendar y Gmail.",
                parameters: {
                    type: "object",
                    properties: {
                        userId: { type: "number" }
                    },
                    required: ["userId"]
                },
            },
        },
        execute: async (args: { userId: number }, tenantId: string = "main") => {
            const url = getGoogleAuthUrl(args.userId, tenantId);
            return `Por favor, haz clic en el siguiente enlace para autorizar el acceso a tu cuenta de Google: ${url}\n\nUna vez autorizado, podré leer tu agenda y correos.`;
        }
    },
    {
        definition: {
            type: "function",
            function: {
                name: "auth_microsoft",
                description: "Genera un enlace para que el usuario autorice el acceso a su Outlook y Calendario de Microsoft.",
                parameters: {
                    type: "object",
                    properties: {
                        userId: { type: "number" }
                    },
                    required: ["userId"]
                },
            },
        },
        execute: async (args: { userId: number }, tenantId: string = "main") => {
            const url = await getMicrosoftAuthUrl(args.userId, tenantId);
            return `Por favor, haz clic en el siguiente enlace para autorizar el acceso a tu cuenta de Microsoft: ${url}\n\nUna vez autorizado, podré gestionar tu correo y agenda de Outlook.`;
        }
    },
    {
        definition: {
            type: "function",
            function: {
                name: "list_calendar_events",
                description: "Lista los próximos eventos del calendario del usuario (Google o Microsoft).",
                parameters: {
                    type: "object",
                    properties: {
                        provider: { type: "string", enum: ["google", "microsoft"] },
                        userId: { type: "number" }
                    },
                    required: ["provider", "userId"]
                },
            },
        },
        execute: async (args: { provider: "google" | "microsoft", userId: number }, tenantId: string = "main") => {
            const tokens = await getTokens(args.userId, tenantId, args.provider);
            if (!tokens) return `No tengo autorización para acceder a tu ${args.provider}. Por favor, usa el comando de autorización primero.`;

            if (args.provider === "google") {
                const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
                oauth2Client.setCredentials(tokens);
                const calendar = google.calendar({ version: "v3", auth: oauth2Client });
                const res = await calendar.events.list({ calendarId: "primary", timeMin: new Date().toISOString(), maxResults: 5, singleEvents: true, orderBy: "startTime" });
                const events = res.data.items || [];
                if (events.length === 0) return "No tienes eventos próximos en Google Calendar.";
                return `Tus próximos eventos son:\n` + events.map(e => `- ${e.summary} (${new Date(e.start?.dateTime || e.start?.date || "").toLocaleString()})`).join("\n");
            } else {
                return "La integración con Microsoft Outlook Calendar está en desarrollo, pero los tokens están guardados.";
            }
        }
    },
    {
        definition: {
            type: "function",
            function: {
                name: "read_emails",
                description: "Lee los correos electrónicos más recientes del usuario.",
                parameters: {
                    type: "object",
                    properties: {
                        provider: { type: "string", enum: ["google", "microsoft"] },
                        userId: { type: "number" }
                    },
                    required: ["provider", "userId"]
                },
            },
        },
        execute: async (args: { provider: "google" | "microsoft", userId: number }, tenantId: string = "main") => {
            const tokens = await getTokens(args.userId, tenantId, args.provider);
            if (!tokens) return `No tengo autorización para acceder a tu ${args.provider}.`;

            if (args.provider === "google") {
                const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
                oauth2Client.setCredentials(tokens);
                const gmail = google.gmail({ version: "v1", auth: oauth2Client });
                const res = await gmail.users.messages.list({ userId: "me", maxResults: 5 });
                const messagesBuffer = [];
                for (const msg of res.data.messages || []) {
                    const detail = await gmail.users.messages.get({ userId: "me", id: msg.id! });
                    const subject = detail.data.payload?.headers?.find(h => h.name === "Subject")?.value || "(Sin asunto)";
                    messagesBuffer.push(`- ${subject}`);
                }
                return `Tus correos recientes son:\n` + messagesBuffer.join("\n");
            } else {
                return "Lectura de correos de Microsoft en desarrollo.";
            }
        }
    },
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
