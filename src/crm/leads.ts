import { db } from "../db/firebase.js";

export interface Lead {
    id?: string;
    tenantId: string;
    userId: string;
    name: string;
    interest: string;
    phone?: string;
    email?: string;
    source: "telegram" | "whatsapp";
    created_at: Date;
}

/**
 * Captura un lead potencial en la base de datos para seguimiento de ventas.
 */
export async function captureLead(lead: Lead) {
    if (!db) return;
    
    console.log(`📈 Capturando nuevo lead para tenant ${lead.tenantId}: ${lead.name}`);
    await db.collection("tenants")
        .doc(lead.tenantId)
        .collection("leads")
        .add({
            ...lead,
            created_at: new Date()
        });
}

/**
 * Obtiene todos los leads de un tenant (para exportación futura).
 */
export async function getLeads(tenantId: string) {
    if (!db) return [];
    
    const snapshot = await db.collection("tenants")
        .doc(tenantId)
        .collection("leads")
        .orderBy("created_at", "desc")
        .get();
        
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
