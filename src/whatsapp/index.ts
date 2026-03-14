import qrcode from 'qrcode-terminal';
import WAWebJS from 'whatsapp-web.js';
const { Client, LocalAuth } = WAWebJS;
import { runAgentLoop } from '../agent/loop.js';
import { upsertUser } from '../memory/index.js';

export function setupWhatsApp() {
    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', (qr: string) => {
        console.log('\n=========================================================');
        console.log('📱 ESCANEA ESTE CÓDIGO QR EN WHATSAPP PARA CONECTAR EL BOT');
        console.log('=========================================================\n');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('✅ Cliente de WhatsApp iniciado y listo para recibir mensajes!');
    });

    client.on('message', async (message: any) => {
        // Ignorar mensajes de grupos o estados 
        if (message.from === "status@broadcast" || message.from.includes("@g.us")) return;

        // Generar un ID numérico a partir del número de teléfono (para compatibilidad con la DB de SQLite)
        let numericId = 0;
        for (let i = 0; i < message.from.length; i++) {
            numericId = Math.imul(31, numericId) + message.from.charCodeAt(i) | 0;
        }
        numericId = Math.abs(numericId); // Hacerlo positivo

        let name = "Usuario_WA";
        try {
            const contact = await message.getContact();
            if (contact) {
                name = contact.pushname || contact.name || "Usuario_WA";
            }
        } catch (e) { }

        await upsertUser({
            id: numericId,
            first_name: name,
            last_name: "WA",
            username: message.from
        }, "main");

        console.log(`[WhatsApp Lead] Mensaje recibido de ${name} (${message.from}): ${message.body}`);

        try {
            const agentResponse = await runAgentLoop(numericId, message.body, "main");
            
            // Enviar el texto de la respuesta
            if (agentResponse.text) {
                await client.sendMessage(message.from, agentResponse.text);
            }

            // Enviar imágenes si las hay
            if (agentResponse.images && agentResponse.images.length > 0) {
                const { MessageMedia } = WAWebJS;
                for (const imageUrl of agentResponse.images) {
                    try {
                        const media = await MessageMedia.fromUrl(imageUrl);
                        await client.sendMessage(message.from, media);
                    } catch (picError: any) {
                        console.error("Error enviando imagen a WhatsApp:", picError.message);
                        await client.sendMessage(message.from, `No pude mostrar la imagen, pero aquí está el link: ${imageUrl}`);
                    }
                }
            }
        } catch (error) {
            console.error("Error al procesar mensaje de WA:", error);
        }
    });

    client.initialize();
    return client;
}
