import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedPrompt: string | null = null;
let lastLoadTime = 0;
const CACHE_TTL = 60000; // 60 segundos en milisegundos

export async function loadSkills(): Promise<string> {
    const now = Date.now();
    
    // Si la caché es válida, devolverla directamente
    if (cachedPrompt && (now - lastLoadTime) < CACHE_TTL) {
        return cachedPrompt;
    }

    const skillsPath = __dirname;
    const folders = await fs.readdir(skillsPath);
    
    let combinedPrompt = "";

    for (const folder of folders) {
        const fullPath = path.join(skillsPath, folder);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
            const skillFile = path.join(fullPath, "SKILL.md");
            if (await fs.pathExists(skillFile)) {
                const content = await fs.readFile(skillFile, "utf-8");
                combinedPrompt += `\n\n--- SKILL: ${folder.toUpperCase()} ---\n${content}`;
            }
        }
    }

    // Actualizar caché
    cachedPrompt = combinedPrompt;
    lastLoadTime = now;
    
    return combinedPrompt;
}
