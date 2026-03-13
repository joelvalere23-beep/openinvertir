import { Context, NextFunction } from "grammy";
import { allowedUserIds } from "../config.js";

export async function whitelistMiddleware(ctx: Context, next: NextFunction) {
    if (!ctx.from) return;

    const userId = ctx.from.id;

    if (allowedUserIds.includes(userId)) {
        // Usuario Admin permitido, dejar pasar
        await next();
    } else {
        // [MODIFICACIÓN PARA VENTAS B2C]: El bot ahora es completamente público para captar inversores.
        console.log(`[Nuevo Lead Detectado] El usuario ID: ${userId} (@${ctx.from.username || 'sin_username'}) ha entrado al embudo.`);
        // Dejamos pasar la solicitud al Bot
        await next();
    }
}
