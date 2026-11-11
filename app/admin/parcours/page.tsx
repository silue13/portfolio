import { Suspense } from "react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { formatPeriod, inputClass } from "@/lib/utils";
import ConfirmButton from "@/components/confirm-button";
import { Banner, CardTitle, Field, Icon, PageHeader, btnPrimary, card } from "@/components/admin-ui";

function readItem(formData: FormData) {
  const num = (k: string) => {
    const v = Number(formData.get(k));
    return isNaN(v) || v < 1950 || v > 2100 ? null : Math.round(v);
  };
  return {
    kind: formData.get("kind") === "formation" ? "formation" : "diplome",
    title: String(formData.get("title") ?? "").trim(),
    school: String(formData.get("school") ?? "").trim(),
    start: num("start_year"),
    end: num("end_year"),
    desc: String(formData.get("description") ?? "").trim() || null,
  };
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin/parcours");
}

async function addItem(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");
  const { kind, title, school, start, end, desc } = readItem(formData);
  if (!title || !school) redirect("/admin/parcours?error=1");

  await sql`
    insert into education (kind, title, school, start_year, end_year, description)
    values (${kind}, ${title}, ${school}, ${start}, ${end}, ${desc})
  `;
  refresh();
  redirect("/admin/parcours?ok=added");
}

async function updateItem(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");
  const { kind, title, school, start, end, desc } = readItem(formData);
  if (!title || !school) redirect("/admin/parcours?error=1");

  await sql`
    update education set kind = ${kind}, title = ${title}, school = ${school},
      start_year = ${start}, end_year = ${end}, description = ${desc}
    where id = ${String(formData.get("id"))}
  `;
  refresh();
  redirect("/admin/parcours?ok=saved");
}

async function deleteItem(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");
  await sql`delete from education where id = ${String(formData.get("id"))}`;
  refresh();
  redirect("/admin/parcours?ok=deleted");
}

function ItemFields({ i }: { i?: Record<string, any> }) {
  return (
    <div className="space-y-4">
      <Field label="Type d'étape">
        <select name="kind" defaultValue={i?.kind ?? "diplome"} className={inputClass}>
          <option value="diplome">🎓 Diplôme académique</option>
          <option value="formation">📜 Certification / Formation</option>
        </select>
      </Field>
      <Field label="Intitulé">
        <input name="title" required defaultValue={i?.title ?? ""} placeholder="Ex : Licence en Statistiques" className={inputClass} />
      </Field>
      <Field label="Établissement / organisme">
        <input name="school" required defaultValue={i?.school ?? ""} placeholder="Université, école ou plateforme" className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Année de début">
          <input name="start_year" type="number" inputMode="numeric" defaultValue={i?.start_year ?? ""} placeholder="2021" className={inputClass} />
        </Field>
        <Field label="Année de fin" hint="Vide = en cours">
          <input name="end_year" type="number" inputMode="numeric" defaultValue={i?.end_year ?? ""} placeholder="2024" className={inputClass} />
        </Field>
      </div>
      <Field label="Description (optionnel)">
        <textarea name="description" rows={3} defaultValue={i?.description ?? ""} placeholder="Spécialité, mention, compétences acquises…" className={inputClass} />
      </Field>
    </div>
  );
}

type SP = { ok?: string; error?: string };

async function ParcoursContent({ searchParams }: { searchParams: Promise<SP> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const sp = await searchParams;

  let items: any[] = [];
  try {
    items = await sql`select * from education order by end_year desc nulls first, start_year desc nulls last`;
  } catch (e) {
    console.error("Erreur chargement éducation:", e);
  }

  const okMsg: Record<string, string> = { added: "Étape ajoutée.", saved: "Modifications enregistrées.", deleted: "Étape supprimée." };

  return (
    <>
      <PageHeader title="Parcours & formations" subtitle="Tes diplômes et certifications, affichés en frise sur ton site." />
      {sp.ok && <Banner kind="ok">{okMsg[sp.ok] ?? "Fait."}</Banner>}
      {sp.error && <Banner kind="error">L'intitulé et l'établissement sont obligatoires.</Banner>}

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-2">
          <details className="lg:hidden" open={items.length === 0}>
            <summary className={`${btnPrimary} w-full cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
              <Icon name="plus" className="h-5 w-5" /> Ajouter une étape
            </summary>
            <form action={addItem} className={`${card} mt-3 space-y-4 p-4`}>
              <ItemFields />
              <button type="submit" className={`${btnPrimary} w-full`}>Ajouter au parcours</button>
            </form>
          </details>

          <form action={addItem} className={`${card} sticky top-8 hidden space-y-4 p-6 lg:block`}>
            <CardTitle icon="plus">Ajouter une étape</CardTitle>
            <ItemFields />
            <button type="submit" className={`${btnPrimary} w-full`}>Ajouter au parcours</button>
          </form>
        </section>

        <section className="lg:col-span-3">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Mon parcours ({items.length})</h2>
          <ul className="space-y-3">
            {items.length === 0 && (
              <li className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
                Aucune étape enregistrée pour le moment.
              </li>
            )}

            {items.map((i) => {
              const period = formatPeriod(i.start_year, i.end_year);
              return (
                <li key={i.id} className={`${card} overflow-hidden`}>
                  <div className="flex items-start gap-3 p-4 sm:p-5">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${i.kind === "diplome" ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"}`}>
                      <Icon name="cap" className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {i.kind === "diplome" ? "Diplôme" : "Certification"}
                        </span>
                        {period && <span className="text-xs font-medium text-slate-400">{period}</span>}
                      </div>
                      <h3 className="mt-1.5 text-base font-semibold text-slate-900">{i.title}</h3>
                      <p className="text-sm font-medium text-indigo-600">{i.school}</p>
                      {i.description && <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{i.description}</p>}
                    </div>
                  </div>

                  <details className="border-t border-slate-100">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50/50 sm:px-5 [&::-webkit-details-marker]:hidden">
                      <span className="flex items-center gap-2"><Icon name="edit" className="h-4 w-4" /> Modifier</span>
                    </summary>
                    <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5">
                      <form action={updateItem} className="space-y-4">
                        <input type="hidden" name="id" value={i.id} />
                        <ItemFields i={i} />
                        <button type="submit" className={`${btnPrimary} w-full sm:w-auto`}>Enregistrer</button>
                      </form>
                      <form action={deleteItem} className="border-t border-slate-200 pt-3">
                        <input type="hidden" name="id" value={i.id} />
                        <ConfirmButton
                          message="Supprimer cette étape du parcours ?"
                          className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          <Icon name="trash" className="h-4 w-4" /> Supprimer cette étape
                        </ConfirmButton>
                      </form>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}

export default function ParcoursPage({ searchParams }: { searchParams: Promise<SP> }) {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-slate-400">Chargement…</div>}>
      <ParcoursContent searchParams={searchParams} />
    </Suspense>
  );
}
