import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

async function test() {
    try {
        console.log("Testing Groq API...");
        const response = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: "Hola, ¿quién eres?" }],
            max_tokens: 10
        });
        console.log("Response:", response.choices[0].message.content);
    } catch (e) {
        console.error("❌ Groq Error:", e.message);
    }
}

test();
