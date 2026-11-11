import { Suspense } from "react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import ConfirmButton from "@/components/confirm-button";
import { Icon, PageHeader, card, iconBtn } from "@/components/admin-ui";

async function toggleRead(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");
  await sql`update contact_messages set read = not read where id = ${String(formData.get("id"))}`;
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

async function deleteMessage(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");
  await sql`delete from contact_messages where id = ${String(formData.get("id"))}`;
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

type Msg = { id: string; name: string; email: string; message: string; read: boolean; created_at: string };

async function MessagesContent() {
  if (!(await isAdmin())) redirect("/admin/login");

  let messages: Msg[] = [];
  let tableMissing = false;
  try {
    messages = (await sql`select id, name, email, message, read, created_at from contact_messages order by created_at desc limit 200`) as Msg[];
  } catch (e) {
    console.error("Erreur chargement messages:", e);
    tableMissing = true;
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Abidjan" });

  const unread = messages.filter((m) => !m.read).length;

  return (
    <>
      <PageHeader
        title="Messages reçus"
        subtitle={unread > 0 ? `${unread} nouveau${unread > 1 ? "x" : ""} message${unread > 1 ? "s" : ""} à lire.` : "Les messages envoyés depuis le formulaire de contact de ton site."}
      />

      {tableMissing && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          La table <code className="font-mono">contact_messages</code> est introuvable. Exécute le fichier{" "}
          <code className="font-mono">db/contact_messages.sql</code> dans l&apos;éditeur SQL de Neon.
        </div>
      )}

      <ul className="space-y-4">
        {!tableMissing && messages.length === 0 && (
          <li className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
            Aucun message pour le moment.
          </li>
        )}

        {messages.map((m) => (
          <li key={m.id} className={`${card} overflow-hidden ${m.read ? "" : "border-indigo-300 ring-2 ring-indigo-100"}`}>
            <div className="flex items-start gap-3 p-4 sm:p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
                {m.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-base font-semibold text-slate-900">{m.name}</h2>
                  {!m.read && <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">Nouveau</span>}
                </div>
                <a href={`mailto:${m.email}`} className="block truncate text-sm font-medium text-indigo-600 hover:underline">{m.email}</a>
                <p className="text-xs text-slate-400">{fmt(m.created_at)}</p>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{m.message}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-3 py-2.5 sm:px-4">
              <a
                href={`mailto:${m.email}?subject=${encodeURIComponent("Re: ton message sur mon portfolio")}`}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-xs font-semibold text-white transition hover:bg-indigo-600"
              >
                <Icon name="mail" className="h-4 w-4" /> Répondre
              </a>
              <form action={toggleRead}>
                <input type="hidden" name="id" value={m.id} />
                <button type="submit" className={iconBtn}>
                  <Icon name={m.read ? "eyeoff" : "check"} className="h-4 w-4" />
                  {m.read ? "Marquer non lu" : "Marquer lu"}
                </button>
              </form>
              <form action={deleteMessage} className="ml-auto">
                <input type="hidden" name="id" value={m.id} />
                <ConfirmButton
                  message="Supprimer définitivement ce message ?"
                  title="Supprimer"
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  <Icon name="trash" className="h-4 w-4" /> Supprimer
                </ConfirmButton>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-slate-400">Chargement…</div>}>
      <MessagesContent />
    </Suspense>
  );
}
