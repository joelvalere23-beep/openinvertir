import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import admin from 'firebase-admin';
import OpenAI from 'openai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());

// Initialize Firebase Admin (Using Local Config if available)
try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
} catch (e) {
    console.warn("⚠️ Firebase Admin skip initialization (No credentials)");
}

const db = admin.firestore?.();

// ◈ AI Financial Core Configuration
const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

// GET: Current Dashboard Summary
app.get('/api/dashboard', async (req, res) => {
    // Demo Static Data (Real logic will query Firestore)
    res.json({
        kpis: {
            ingresos: 128400,
            egresos: 42300,
            utilidad: 86100,
            facturas: 12
        }
    });
});

// POST: AI Advisor Consulting
app.post('/api/ai/advise', async (req, res) => {
    const { prompt, context } = req.body;
    
    try {
        const completion = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "Eres ContaPro AI, el asesor contable de Joel Valera. Analiza sus datos financieros y sugiere optimizaciones fiscales o de ahorro. Sé elocuente y profesional." },
                { role: "user", content: `Contextual financial data: ${JSON.stringify(context || {})}\n\nQuestion: ${prompt}` }
            ]
        });
        
        res.json({ response: completion.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "AI Engine error" });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`◈ ContaPro Server Running on port ${PORT}`);
});
