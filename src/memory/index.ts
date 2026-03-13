import { db } from "../db/firebase.js";

// Tipos
export interface ChatMessage {
  id?: string;
  user_id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: any;
}

export interface User {
  id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
}

// Funciones para gestionar usuarios
export async function upsertUser(user: User) {
  if (!db) return;
  
  const userRef = db.collection("users").doc(user.id.toString());
  await userRef.set({
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    updated_at: new Date()
  }, { merge: true });
}

// Funciones de memoria
export async function addMessage(message: ChatMessage) {
  if (!db) return null;

  const memoryRef = db.collection("users").doc(message.user_id.toString()).collection("memory");
  const result = await memoryRef.add({
    role: message.role,
    content: message.content,
    created_at: new Date()
  });
  return result.id;
}

export async function getRecentContext(userId: number, limit: number = 20): Promise<ChatMessage[]> {
  if (!db) return [];

  const memoryRef = db.collection("users").doc(userId.toString()).collection("memory");
  const snapshot = await memoryRef
    .orderBy("created_at", "desc")
    .limit(limit)
    .get();

  const messages: ChatMessage[] = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    messages.push({
      id: doc.id,
      user_id: userId,
      role: data.role,
      content: data.content,
      created_at: data.created_at
    });
  });

  return messages.reverse();
}

export async function clearMemory(userId: number) {
  if (!db) return;

  const memoryRef = db.collection("users").doc(userId.toString()).collection("memory");
  const snapshot = await memoryRef.get();
  
  const batch = db.batch();
  snapshot.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}
