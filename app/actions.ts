"use server";

import { sql } from "@/lib/db";
import type { ContactState } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function sendMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // champ piège invisible : seuls les robots le remplissent
  if (String(formData.get("website") ?? "").trim()) return { ok: true };

  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  const email = String(formData.get("email") ?? "").trim().slice(0, 150);
  const message = String(formData.get("message") ?? "").trim().slice(0, 2000);

  if (name.length < 2) return { ok: false, error: "Indique ton nom (2 caractères minimum)." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Cette adresse e-mail ne semble pas valide." };
  if (message.length < 10) return { ok: false, error: "Ton message est trop court (10 caractères minimum)." };

  try {
    const recent = await sql`
      select count(*)::int as n from contact_messages
      where lower(email) = ${email.toLowerCase()} and created_at > now() - interval '10 minutes'
    `;
    if (Number(recent[0]?.n ?? 0) >= 3) {
      return { ok: false, error: "Trop de messages envoyés d'affilée. Réessaie dans quelques minutes." };
    }
    await sql`insert into contact_messages (name, email, message) values (${name}, ${email}, ${message})`;
    return { ok: true };
  } catch (e) {
    console.error("sendMessage:", e);
    return { ok: false, error: "Envoi impossible pour le moment. Écris-moi directement par e-mail ou WhatsApp." };
  }
}
