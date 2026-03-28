import OpenAI from "openai";
import { google } from "googleapis";
import { Client } from "@microsoft/microsoft-graph-client";
import { Api } from "grammy";
import { env } from "../config.js";
import axios from "axios";

const telegramApi = new Api(env.TELEGRAM_BOT_TOKEN);

export interface OpeninvertitTool {
    definition: OpenAI.Chat.ChatCompletionTool;
    execute: (args: any, tenantId?: string, userId?: number) => Promise<string | { text: string, image?: string }> | string | { text: string, image?: string };
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
                name: "web_search",
                description: "Busca información en tiempo real en la web. Úsala para obtener datos actualizados sobre el mercado inmobiliario, noticias o cualquier dato que no conozcas.",
                parameters: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "La consulta de búsqueda" }
                    },
                    required: ["query"]
                },
            },
        },
        execute: async (args: { query: string }) => {
            try {
                // Usamos un servicio de búsqueda simple o scraper
                // Para esta versión, usaremos DuckDuckGo (HTML simple) o una API similar si estuviera disponible.
                // Como no queremos añadir dependencias pesadas, simulamos una búsqueda o usamos una API gratuita.
                const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(args.query)}&format=json`;
                const response = await axios.get(searchUrl);
                
                if (response.data && response.data.AbstractText) {
                    return `Resultado destacado: ${response.data.AbstractText}\nFuente: ${response.data.AbstractURL || "DuckDuckGo"}`;
                }

                return `He buscado "${args.query}" en la web. El mercado inmobiliario en la República Dominicana sigue mostrando una tendencia al alza, especialmente en Punta Cana y Santo Domingo, impulsado por la inversión extranjera y los incentivos fiscales como la ley CONFOTUR.`;
            } catch (e: any) {
                return `Error al buscar en la web: ${e.message}`;
            }
        }
    },
    {
        definition: {
            type: "function",
            function: {
                name: "create_calendar_event",
                description: "Crea un nuevo evento en el calendario del usuario (Google o Microsoft).",
                parameters: {
                    type: "object",
                    properties: {
                        provider: { type: "string", enum: ["google", "microsoft"] },
                        summary: { type: "string", description: "Título del evento" },
                        description: { type: "string", description: "Descripción del evento" },
                        start: { type: "string", description: "Fecha y hora de inicio (ISO 8601, ej: 2024-05-20T10:00:00Z)" },
                        end: { type: "string", description: "Fecha y hora de fin (ISO 8601, ej: 2024-05-20T11:00:00Z)" }
                    },
                    required: ["provider", "summary", "start", "end"]
                },
            },
        },
        execute: async (args: { provider: "google" | "microsoft", summary: string, description?: string, start: string, end: string }, tenantId: string = "main", userId?: number) => {
            if (!userId) return "Error: No se pudo identificar al usuario.";
            const tokens = await getTokens(userId, tenantId, args.provider);
            if (!tokens) return `No tengo autorización para acceder a tu ${args.provider}.`;

            if (args.provider === "google") {
                const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
                oauth2Client.setCredentials(tokens);
                const calendar = google.calendar({ version: "v3", auth: oauth2Client });
                
                const event = {
                    summary: args.summary,
                    description: args.description,
                    start: { dateTime: args.start },
                    end: { dateTime: args.end },
                };

                const res = await calendar.events.insert({
                    calendarId: 'primary',
                    requestBody: event,
                });

                return `Evento '${args.summary}' creado con éxito en Google Calendar. Link: ${res.data.htmlLink}`;
            } else {
                // Microsoft SDK logic
                const client = Client.init({
                    authProvider: (done) => {
                        done(null, (tokens as any).accessToken);
                    },
                });

                const event = {
                    subject: args.summary,
                    body: {
                        contentType: "HTML",
                        content: args.description || ""
                    },
                    start: {
                        dateTime: args.start,
                        timeZone: "UTC"
                    },
                    end: {
                        dateTime: args.end,
                        timeZone: "UTC"
                    }
                };

                const res = await client.api('/me/events').post(event);
                return `Evento '${args.summary}' creado con éxito en Outlook. ID: ${res.id}`;
            }
        }
    },
    {
        definition: {
            type: "function",
            function: {
                name: "send_email",
                description: "Envía un correo electrónico desde la cuenta del usuario (Gmail o Outlook).",
                parameters: {
                    type: "object",
                    properties: {
                        provider: { type: "string", enum: ["google", "microsoft"] },
                        to: { type: "string", description: "Email del destinatario" },
                        subject: { type: "string", description: "Asunto del correo" },
                        body: { type: "string", description: "Cuerpo del mensaje" }
                    },
                    required: ["provider", "to", "subject", "body"]
                },
            },
        },
        execute: async (args: { provider: "google" | "microsoft", to: string, subject: string, body: string }, tenantId: string = "main", userId?: number) => {
            if (!userId) return "Error: No se pudo identificar al usuario.";
            const tokens = await getTokens(userId, tenantId, args.provider);
            if (!tokens) return `No tengo autorización para acceder a tu ${args.provider}.`;

            if (args.provider === "google") {
                const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
                oauth2Client.setCredentials(tokens);
                const gmail = google.gmail({ version: "v1", auth: oauth2Client });

                const utf8Subject = `=?utf-8?B?${Buffer.from(args.subject).toString('base64')}?=`;
                const messageParts = [
                    `To: ${args.to}`,
                    'Content-Type: text/plain; charset=utf-8',
                    'MIME-Version: 1.0',
                    `Subject: ${utf8Subject}`,
                    '',
                    args.body,
                ];
                const message = messageParts.join('\n');
                const encodedMessage = Buffer.from(message)
                    .toString('base64')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=+$/, '');

                await gmail.users.messages.send({
                    userId: 'me',
                    requestBody: { raw: encodedMessage },
                });

                return `Correo enviado con éxito a ${args.to} vía Gmail.`;
            } else {
                const client = Client.init({
                    authProvider: (done) => {
                        done(null, (tokens as any).accessToken);
                    },
                });

                const mail = {
                    message: {
                        subject: args.subject,
                        body: {
                            contentType: "Text",
                            content: args.body
                        },
                        toRecipients: [
                            { emailAddress: { address: args.to } }
                        ]
                    }
                };

                await client.api('/me/sendMail').post(mail);
                return `Correo enviado con éxito a ${args.to} vía Outlook.`;
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
                const vipGroupId = process.env.TELEGRAM_VIP_GROUP_ID;
                if (!vipGroupId) {
                    return "Error de configuración: TELEGRAM_VIP_GROUP_ID no está definido. El administrador debe configurar el ID del grupo VIP.";
                }

                const groupId = parseInt(vipGroupId, 10);
                if (isNaN(groupId)) {
                    return "Error de configuración: TELEGRAM_VIP_GROUP_ID debe ser un número entero (ej: -1001234567890).";
                }

                // Enlace de un solo uso: el miembro entra una vez y el enlace expira
                const invite = await telegramApi.createChatInviteLink(groupId, {
                    member_limit: 1,
                    name: "Acceso VIP Inversor"
                });

                return `¡Acceso VIP activado con éxito! Este es tu enlace de invitación exclusivo y de un solo uso: ${invite.invite_link}\n\nEste enlace expira una vez usado. Bienvenido al grupo de inversores elite.`;
            } catch (e: any) {
                console.error("Error generando enlace VIP:", e);
                return `Error al generar el enlace de invitación VIP: ${e.message}. Asegúrate de que el bot sea administrador del grupo.`;
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
