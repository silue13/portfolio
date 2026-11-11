"use client";

import { useActionState } from "react";
import { sendMessage } from "@/app/actions";
import type { ContactState } from "@/lib/types";

const initial: ContactState = { ok: false };

const field =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-base sm:py-2.5 sm:text-sm text-white placeholder:text-slate-500 transition focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20";

export default function ContactForm() {
  const [state, action, pending] = useActionState(sendMessage, initial);

  if (state.ok) {
    return (
      <div role="status" className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-center">
        <p className="text-2xl">✓</p>
        <p className="mt-2 text-base font-semibold text-white">Message envoyé</p>
        <p className="mt-1 text-sm text-slate-300">Merci ! Je te réponds dans les meilleurs délais.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left sm:p-6">
      <div>
        <label htmlFor="c-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Nom</label>
        <input id="c-name" name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Ton nom" className={field} />
      </div>
      <div>
        <label htmlFor="c-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">E-mail</label>
        <input id="c-email" name="email" type="email" required maxLength={150} autoComplete="email" placeholder="toi@exemple.com" className={field} />
      </div>
      <div>
        <label htmlFor="c-message" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Message</label>
        <textarea id="c-message" name="message" required minLength={10} maxLength={2000} rows={5} placeholder="Parle-moi de ton projet…" className={field} />
      </div>

      {/* champ piège anti-spam : invisible pour les humains */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Ne pas remplir
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-indigo-600 py-3.5 text-base sm:py-3 sm:text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Envoi en cours…" : "Envoyer le message"}
      </button>
    </form>
  );
}
