import { google } from "googleapis";
import { env } from "../config.js";

const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/google/callback";

export function getGoogleAuthUrl(userId: number, tenantId: string) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        REDIRECT_URI
    );

    const scopes = [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/drive.file"
    ];

    // Incluimos userId y tenantId en el state para recuperarlos en el callback
    const state = Buffer.from(JSON.stringify({ userId, tenantId })).toString("base64");

    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        state: state,
        prompt: "consent"
    });
}

export async function getGoogleTokens(code: string) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}
