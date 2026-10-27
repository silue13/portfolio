import { Suspense } from "react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

async function addItem(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");

  const num = (k: string) => {
    const v = Number(formData.get(k));
    return isNaN(v) || v === 0 ? null : v;
  };
  const desc = String(formData.get("description") ?? "").trim() || null;

  await sql`
    insert into education (kind, title, school, start_year, end_year, description)
    values (${String(formData.get("kind") ?? "diplome")}, ${String(formData.get("title") ?? "").trim()}, ${String(formData.get("school") ?? "").trim()},
            ${num("start_year")}, ${num("end_year")}, ${desc})
  `;

  revalidatePath("/");
  revalidatePath("/admin/parcours");
}

async function deleteItem(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");

  await sql`delete from education where id = ${String(formData.get("id"))}`;
  revalidatePath("/");
  revalidatePath("/admin/parcours");
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600";

async function ParcoursContent() {
  if (!(await isAdmin())) redirect("/admin/login");

  let items: any[] = [];
  try {
    items = await sql`select * from education order by end_year desc nulls first, start_year desc nulls last`;
  } catch (e) {
    console.error("Erreur chargement éducation:", e);
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Link
              href="/admin"
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              ←
            </Link>
            <h1 className="text-sm font-bold text-slate-900 sm:text-base">Parcours & Formations</h1>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 sm:text-xs"
          >
            Voir le site ↗
          </a>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 pt-6 sm:px-6 sm:pt-8 lg:grid-cols-12 lg:gap-8">
        {/* Formulaire */}
        <section className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="border-b border-slate-100 pb-2.5 text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-sm">
              Ajouter une étape
            </h2>

            <form action={addItem} className="mt-4 space-y-3 sm:space-y-4">
              <div>
                <label className={labelClass}>Type d&apos;étape</label>
                <select name="kind" className={inputClass}>
                  <option value="diplome">🎓 Diplôme académique</option>
                  <option value="formation">📜 Certification / Formation</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Intitulé</label>
                <input name="title" required placeholder="Ex: Licence en Statistiques" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Établissement / Organisme</label>
                <input name="school" required placeholder="Université ou plateforme" className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className={labelClass}>Année début</label>
                  <input name="start_year" type="number" placeholder="2021" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Année fin</label>
                  <input name="end_year" type="number" placeholder="2024" className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Description (optionnel)</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Spécialisations ou résultats..."
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.99]"
              >
                Ajouter au parcours
              </button>
            </form>
          </div>
        </section>

        {/* Liste */}
        <section className="lg:col-span-7">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-sm">
            Mon parcours ({items.length})
          </h2>

          <div className="space-y-3">
            {items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-400 sm:text-sm">
                Aucune étape enregistrée pour le moment.
              </div>
            )}

            {items.map((i) => (
              <div
                key={i.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="min-w-0">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 sm:text-xs">
                    {i.kind === "diplome" ? "Diplôme" : "Certification"}
                  </span>
                  <h3 className="mt-1.5 truncate font-semibold text-slate-900 text-sm sm:text-base">{i.title}</h3>
                  <p className="text-xs font-medium text-indigo-600">
                    {i.school} · {i.start_year}{i.end_year ? ` – ${i.end_year}` : " – Présent"}
                  </p>
                  {i.description && (
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{i.description}</p>
                  )}
                </div>

                <form action={deleteItem} className="shrink-0">
                  <input type="hidden" name="id" value={i.id} />
                  <button
                    type="submit"
                    title="Supprimer"
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function ParcoursPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Chargement…</div>}>
      <ParcoursContent />
    </Suspense>
  );
}