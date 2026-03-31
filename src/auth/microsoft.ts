import { ConfidentialClientApplication, Configuration, LogLevel } from "@azure/msal-node";

const REDIRECT_URI = process.env.MS_REDIRECT_URI || "http://localhost:3000/auth/microsoft/callback";

const msalConfig: Configuration = {
    auth: {
        clientId: process.env.MS_CLIENT_ID || "",
        authority: "https://login.microsoftonline.com/common",
        clientSecret: process.env.MS_CLIENT_SECRET || "",
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Info,
        },
    },
};

const pca = msalConfig.auth.clientId && msalConfig.auth.clientSecret 
    ? new ConfidentialClientApplication(msalConfig)
    : null;

export async function getMicrosoftAuthUrl(userId: number, tenantId: string) {
    if (!pca) return "Error: Configuración de Microsoft incompleta.";
    const state = Buffer.from(JSON.stringify({ userId, tenantId })).toString("base64");
    
    const authCodeUrlParameters = {
        scopes: ["user.read", "Calendars.ReadWrite", "Mail.Send", "Mail.ReadWrite"],
        redirectUri: REDIRECT_URI,
        state: state
    };

    return await pca.getAuthCodeUrl(authCodeUrlParameters);
}

export async function getMicrosoftTokens(code: string) {
    const tokenRequest = {
        code: code,
        scopes: ["user.read", "Calendars.ReadWrite", "Mail.Send", "Mail.ReadWrite"],
        redirectUri: REDIRECT_URI,
    };

    return await pca.acquireTokenByCode(tokenRequest);
}
