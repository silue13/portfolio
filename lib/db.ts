import { neon } from "@neondatabase/serverless";

let client: ReturnType<typeof neon> | null = null;

/**
 * Client Neon créé à la demande : si DATABASE_URL manque, l'erreur est levée
 * au moment de la requête (donc rattrapée par les try/catch des pages)
 * au lieu de faire planter toute l'application au démarrage.
 */
export function sql(strings: TemplateStringsArray, ...values: unknown[]): Promise<Record<string, any>[]> {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL est manquant : vérifie ton fichier .env.local (ou les variables Vercel).");
    }
    client = neon(url);
  }
  return client(strings, ...values) as unknown as Promise<Record<string, any>[]>;
}