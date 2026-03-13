import { db } from "./src/db/firebase.js";
import { createChatCompletion } from "./src/llm/client.js";

async function test() {
    console.log("🔍 Iniciando pruebas de conectividad...");

    // Test Firebase
    if (!db) {
        console.error("❌ Error: Firebase no inicializado correctamente.");
    } else {
        try {
            console.log("📡 Probando Firestore...");
            await db.collection("test").doc("ping").set({ time: new Date() });
            console.log("✅ Firestore funcionando correctamente.");
        } catch (e) {
            console.error("❌ Error al conectar con Firestore:", e);
        }
    }

    // Test LLM
    try {
        console.log("🧠 Probando Groq LLM...");
        const response = await createChatCompletion([{ role: "user", content: "Hola, dime 'OK' si me escuchas." }]);
        console.log("✅ LLM funcionando. Respuesta:", response.choices[0].message.content);
    } catch (e) {
        console.error("❌ Error al conectar con Groq:", e);
    }

    process.exit(0);
}

test();
