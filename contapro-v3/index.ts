import 'dotenv/config';
import { TelegramBot } from "./bot/telegram.js";
import { FinancialAdvisor } from "./llm/advisor.js";

// 🚀 ContaPro V3 — Professional Financial Engine
async function bootstrap() {
    console.log("◈ ContaPro V3: Professional Engine Starting...");
    
    // Real LLM-based financial logic starting...
    const advisor = new FinancialAdvisor();
    
    // Telegram Bot for real-time reporting
    const bot = new TelegramBot(process.env.TELEGRAM_TOKEN);
    bot.start();
    
    console.log("✅ Engine ready. Listening for financial transactions.");
}

bootstrap().catch(console.error);
