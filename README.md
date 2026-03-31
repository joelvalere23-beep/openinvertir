# 🦞 Ian: Agente de IA para Openinvertir (v1.0.3)

Este es el cerebro de Ian, un asistente multimodal avanzado diseñado para gestionar inversiones, automatizar calendarios y proporcionar respuestas elocuentes vía Telegram y WhatsApp.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/joelvalere23-beep/openinvertir)

## 🚀 Capacidades Actuales:
- **Multimodalidad:** Ve archivos, oye audios y genera imágenes (DALL-E 3 / AI Horde Gratis).
- **Voz Natural:** Integración inspirada en Microsoft VibeVoice para audios humanos.
- **Gestión:** Sincronización con Google Calendar, Gmail y Microsoft Outlook.
- **CRM:** Captura de leads directamente en Firestore.
- **Autonomía:** Preparado para funcionar 24/7 en la nube mediante Docker.

## 🛠️ Despliegue (Hacer que sea Libre):
Para que Ian funcione sin depender de tu computadora local:
1. Haz clic en el botón **"Deploy on Railway"** arriba.
2. Conecta tu repositorio de GitHub `joelvalere23-beep/openinvertir`.
3. Copia tus variables del archivo `.env` en la sección "Variables" de Railway.
4. ¡Listo! Ian ya no dependerá de tu conexión local.

## 📁 Estructura:
- `src/agent/tools.ts`: Herramientas y funciones que Ian puede ejecutar.
- `src/bot/`: Lógica del bot de Telegram (grammY).
- `src/whatsapp/`: Integración con WhatsApp Web (Puppeteer).
- `src/utils/audio.ts`: Motor de voz y transcripción.
