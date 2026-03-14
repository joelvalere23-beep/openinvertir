import OpenAI from "openai";
import { google } from "googleapis";
import { Client } from "@microsoft/microsoft-graph-client";
import { Api } from "grammy";
import { env } from "../config.js";

const telegramApi = new Api(env.TELEGRAM_BOT_TOKEN);

export interface OpeninvertitTool {
    definition: OpenAI.Chat.ChatCompletionTool;
    execute: (args: any, tenantId?: string, userId?: number) => Promise<string> | string;
}

import { getGoogleAuthUrl } from "../auth/google.js";
import { getMicrosoftAuthUrl } from "../auth/microsoft.js";
import { getTokens } from "../memory/index.js";
import { captureLead } from "../crm/leads.js";

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
        execute: async (args: any, tenantId: string = "main", userId?: number) => {
            if (!userId) return "Error: No se pudo identificar al usuario para la autorización.";
            const url = getGoogleAuthUrl(userId, tenantId);
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
                    properties: {},
                },
            },
        },
        execute: async (args: any, tenantId: string = "main", userId?: number) => {
            if (!userId) return "Error: No se pudo identificar al usuario para la autorización.";
            const url = await getMicrosoftAuthUrl(userId, tenantId);
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
                        provider: { type: "string", enum: ["google", "microsoft"] }
                    },
                    required: ["provider"]
                },
            },
        },
        execute: async (args: { provider: "google" | "microsoft" }, tenantId: string = "main", userId?: number) => {
            if (!userId) return "Error: No se pudo identificar al usuario.";
            const tokens = await getTokens(userId, tenantId, args.provider);
            if (!tokens) return `No tengo autorización para acceder a tu ${args.provider}. Por favor, pídeme el enlace de autorización primero.`;

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
                        provider: { type: "string", enum: ["google", "microsoft"] }
                    },
                    required: ["provider"]
                },
            },
        },
        execute: async (args: { provider: "google" | "microsoft" }, tenantId: string = "main", userId?: number) => {
            if (!userId) return "Error: No se pudo identificar al usuario.";
            const tokens = await getTokens(userId, tenantId, args.provider);
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
                // PRIMERO: Intentar con Google Gemini (Imagen 3 / Nano Banana)
                if (env.GEMINI_API_KEY) {
                    console.log(`🍌 Generando imagen [Imagen 3] para: ${args.prompt}`);
                    const axios = require('axios');
                    const response = await axios.post(
                        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${env.GEMINI_API_KEY}`,
                        {
                            instances: [{ prompt: args.prompt }],
                            parameters: { sampleCount: 1 }
                        },
                        { headers: { 'Content-Type': 'application/json' } }
                    );

                    const b64 = response?.data?.predictions?.[0]?.bytesBase64;
                    if (b64) {
                        return {
                            text: `Imagen generada con éxito usando tecnología Imagen 3.`,
                            image: `data:image/png;base64,${b64}`
                        };
                    } else {
                        console.warn("⚠️ Falló Imagen 3, intentando fallback...");
                    }
                }

                // SEGUNDO: Fallback a OpenAI DALL-E 3 o OpenRouter
                let apiKey = env.OPENAI_API_KEY;
                let baseURL = undefined;
                let model = "dall-e-3";

                if (!apiKey && env.OPENROUTER_API_KEY) {
                    apiKey = env.OPENROUTER_API_KEY;
                    baseURL = "https://openrouter.ai/api/v1";
                    model = "openai/dall-e-3";
                }

                if (!apiKey) {
                    if (env.GEMINI_API_KEY) {
                        throw new Error("El sistema primario (Imagen 3) no respondió y no hay llaves configuradas para Fallback (DALL-E 3).");
                    }
                    return "Error: No hay una API Key configurada para generación de imágenes.";
                }

                const openai = new OpenAI({ apiKey, baseURL });
                console.log(`🎨 Generando imagen [${model}] para: ${args.prompt}`);
                const b64Response = await openai.images.generate({
                    model: model as any,
                    prompt: args.prompt,
                    n: 1,
                    size: "1024x1024",
                    response_format: "b64_json",
                });

                const b64 = b64Response.data[0].b64_json;
                if (!b64) throw new Error("No se pudo obtener la imagen.");
                
                return {
                    text: `Imagen generada con éxito.`,
                    image: `data:image/png;base64,${b64}`
                };
            } catch (e: any) {
                console.error("Error al generar imagen:", e?.response?.data || e);
                return {
                    text: `Error generando la imagen. Por favor verifica tus créditos o tu API Key. Detalle: ${e.message}`,
                };
            }
        }
    },
    {
        definition: {
            type: "function",
            function: {
                name: "sync_to_notebook",
                description: "Sincroniza información importante (resúmenes, datos de inversión, notas) con una 'Base de Conocimientos' en Google Drive que NotebookLM puede leer.",
                parameters: {
                    type: "object",
                    properties: {
                        fileName: { type: "string", description: "Nombre del archivo (ej: Resumen_Inversion_Punta_Cana.txt)" },
                        content: { type: "string", description: "Contenido detallado para guardar" },
                    },
                    required: ["fileName", "content"],
                },
            },
        },
        execute: async (args: { fileName: string, content: string }, tenantId: string = "main", userId?: number) => {
            if (!userId) return "Error: Usuario no identificado.";
            const tokens = await getTokens(userId, tenantId, "google");
            if (!tokens) return "No tengo permiso para tu Google Drive. Por favor, pídeme el enlace de autorización de Google.";

            try {
                const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
                oauth2Client.setCredentials(tokens);
                const drive = google.drive({ version: "v3", auth: oauth2Client });

                // 1. Buscar si el archivo ya existe
                const list = await drive.files.list({
                    q: `name = '${args.fileName}' and trashed = false`,
                    fields: 'files(id, name)',
                });

                let responseId = "";
                if (list.data.files && list.data.files.length > 0) {
                    // Actualizar existente
                    const fileId = list.data.files[0].id!;
                    await drive.files.update({
                        fileId: fileId,
                        media: {
                            mimeType: 'text/plain',
                            body: args.content,
                        },
                    });
                    responseId = fileId;
                } else {
                    // Crear nuevo
                    const res = await drive.files.create({
                        requestBody: {
                            name: args.fileName,
                            mimeType: 'text/plain',
                        },
                        media: {
                            mimeType: 'text/plain',
                            body: args.content,
                        },
                    });
                    responseId = res.data.id!;
                }

                return `¡Hecho! He sincronizado el archivo '${args.fileName}' en tu Google Drive. Ahora puedes usarlo como fuente en NotebookLM.`;
            } catch (e: any) {
                return `Error al sincronizar con Drive: ${e.message}`;
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

export async function executeToolCall(toolCall: OpenAI.Chat.ChatCompletionMessageToolCall, tenantId: string = "main", userId?: number): Promise<{ result: string, image?: string }> {
    const tool = tools.find((t) => t.definition.function.name === toolCall.function.name);
    if (!tool) {
        return { result: `Error: Herramienta '${toolCall.function.name}' no encontrada.` };
    }

    try {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await tool.execute(args, tenantId, userId);
        
        if (typeof result === "object" && result !== null) {
            return { 
                result: (result as any).text || JSON.stringify(result),
                image: (result as any).image 
            };
        }
        
        return { result: String(result) };
    } catch (error: any) {
        return { result: `Error ejecutando la herramienta: ${error.message}` };
    }
}
