import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV !== "production") {
  console.warn("⚠️ DATABASE_URL est manquant : vérifie ton fichier .env.local");
}

export const sql = neon(databaseUrl || "");