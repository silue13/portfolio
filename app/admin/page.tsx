import { Suspense } from "react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { inputClass, parseTech, safeUrl, slugify } from "@/lib/utils";
import ConfirmButton from "@/components/confirm-button";
import { Banner, Field, Icon, PageHeader, btnPrimary, card, fileClass, iconBtn } from "@/components/admin-ui";

const MAX_LOGO = 300 * 1024; // 300 Ko

async function fileToDataUrl(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) return null;
  if (file.size > MAX_LOGO) throw new Error("Logo trop lourd : 300 Ko maximum.");
  const buf = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buf.toString("base64")}`;
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin");
}

function readFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    summary: String(formData.get("summary") ?? "").trim(),
    category: formData.get("category") === "data" ? "data" : "web",
    demo: safeUrl(String(formData.get("demo_url") ?? "")),
    tech: String(formData.get("tech") ?? "").split(",").map((t) => t.trim()).filter(Boolean),
  };
}

async function readLogo(formData: FormData) {
  try {
    return await fileToDataUrl(formData.get("logo"));
  } catch {
    return "ERROR" as const;
  }
}

async function addProject(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");

  const { title, summary, category, demo, tech } = readFields(formData);
  const published = formData.get("published") === "on";
  const logo = await readLogo(formData);

  if (logo === "ERROR") redirect("/admin?error=logo");
  if (!title || !summary) redirect("/admin?error=fields");

  // la table exige un "slug" unique : on le génère à partir du titre
  let slug = slugify(title);
  const taken = await sql`select 1 from projects where slug = ${slug} limit 1`;
  if (taken.length > 0) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  await sql`
    insert into projects (title, slug, category, summary, tech, demo_url, logo_url, published, position)
    values (${title}, ${slug}, ${category}, ${summary}, ${tech}::text[], ${demo}, ${logo}, ${published},
            (select coalesce(max(position), 0) + 1 from projects))
  `;
  refresh();
  redirect("/admin?ok=added");
}

async function updateProject(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");

  const id = String(formData.get("id"));
  const { title, summary, category, demo, tech } = readFields(formData);
  const removeLogo = formData.get("remove_logo") === "on";
  const newLogo = await readLogo(formData);

  if (newLogo === "ERROR") redirect("/admin?error=logo");
  if (!title || !summary) redirect("/admin?error=fields");

  if (removeLogo) {
    await sql`update projects set title = ${title}, summary = ${summary}, category = ${category}, tech = ${tech}::text[], demo_url = ${demo}, logo_url = null where id = ${id}`;
  } else if (newLogo) {
    await sql`update projects set title = ${title}, summary = ${summary}, category = ${category}, tech = ${tech}::text[], demo_url = ${demo}, logo_url = ${newLogo} where id = ${id}`;
  } else {
    await sql`update projects set title = ${title}, summary = ${summary}, category = ${category}, tech = ${tech}::text[], demo_url = ${demo} where id = ${id}`;
  }
  refresh();
  redirect("/admin?ok=saved");
}

async function togglePublished(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");
  await sql`update projects set published = not published where id = ${String(formData.get("id"))}`;
  refresh();
}

async function deleteProject(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");
  await sql`delete from projects where id = ${String(formData.get("id"))}`;
  refresh();
  redirect("/admin?ok=deleted");
}

async function moveProject(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");

  const id = String(formData.get("id"));
  const step = formData.get("dir") === "up" ? -1 : 1;
  const rows = await sql`select id from projects order by position asc nulls last, created_at desc`;
  const ids = rows.map((r) => String(r.id));
  const i = ids.indexOf(id);
  const j = i + step;
  if (i < 0 || j < 0 || j >= ids.length) return;

  [ids[i], ids[j]] = [ids[j], ids[i]];
  await sql`
    update projects p set position = v.pos
    from (select u.id, u.ord::int as pos from unnest(${ids}::text[]) with ordinality as u(id, ord)) v
    where p.id::text = v.id
  `;
  refresh();
}

/* ---------- formulaire partagé (ajout + modification) ---------- */
function ProjectFields({ p }: { p?: Record<string, any> }) {
  const category = p?.category === "web" ? "web" : "data";
  const radio =
    "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 has-[:checked]:text-indigo-700 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-indigo-500/20";

  return (
    <div className="space-y-4">
      <Field label="Titre du projet">
        <input name="title" required defaultValue={p?.title ?? ""} placeholder="Ex : Dashboard des ventes" className={inputClass} />
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Catégorie</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className={radio}>
            <input type="radio" name="category" value="data" defaultChecked={category === "data"} className="sr-only" />
            📊 Data
          </label>
          <label className={radio}>
            <input type="radio" name="category" value="web" defaultChecked={category === "web"} className="sr-only" />
            💻 Web
          </label>
        </div>
      </fieldset>

      <Field label="Résumé">
        <textarea name="summary" required rows={3} defaultValue={p?.summary ?? ""} placeholder="2 à 3 phrases qui décrivent le projet…" className={inputClass} />
      </Field>

      <Field label="Technologies" hint="Sépare-les par des virgules : Python, SQL, Power BI">
        <input name="tech" defaultValue={parseTech(p?.tech).join(", ")} placeholder="Python, SQL, Power BI" className={inputClass} />
      </Field>

      <Field label="Lien de démonstration (optionnel)" hint="Ajoute un bouton « Tester l'application » sur le site">
        <input name="demo_url" type="url" defaultValue={p?.demo_url ?? ""} placeholder="https://…" className={inputClass} />
      </Field>

      <Field label={p ? "Remplacer le logo" : "Logo (300 Ko maximum)"}>
        <input name="logo" type="file" accept="image/*" className={fileClass} />
      </Field>

      {p?.logo_url && (
        <label className="flex min-h-11 items-center gap-2.5 text-sm text-slate-600">
          <input type="checkbox" name="remove_logo" className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
          Supprimer le logo actuel
        </label>
      )}
    </div>
  );
}

type SP = { error?: string; ok?: string };

async function DashboardContent({ searchParams }: { searchParams: Promise<SP> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const sp = await searchParams;

  let projects: any[] = [];
  try {
    projects = await sql`
      select id, title, category, summary, tech, demo_url, logo_url, published
      from projects
      order by position asc nulls last, created_at desc
    `;
  } catch (error) {
    console.error("Erreur récupération projets:", error);
  }

  const total = projects.length;
  const stats = [
    { label: "Total", value: total, tone: "bg-indigo-50 text-indigo-600", icon: "folder" },
    { label: "En ligne", value: projects.filter((p) => p.published).length, tone: "bg-emerald-50 text-emerald-600", icon: "eye" },
    { label: "Data", value: projects.filter((p) => p.category === "data").length, tone: "bg-teal-50 text-teal-600", icon: "chart" },
    { label: "Web", value: projects.filter((p) => p.category === "web").length, tone: "bg-violet-50 text-violet-600", icon: "edit" },
  ];

  const okMsg: Record<string, string> = {
    added: "Projet ajouté avec succès.",
    saved: "Modifications enregistrées.",
    deleted: "Projet supprimé.",
  };

  return (
    <>
      <PageHeader title="Projets" subtitle="Ajoute, modifie et réorganise les réalisations affichées sur ton site." />

      {sp.ok && <Banner kind="ok">{okMsg[sp.ok] ?? "Fait."}</Banner>}
      {sp.error && (
        <Banner kind="error">
          {sp.error === "logo" ? "Logo trop lourd (300 Ko maximum) : rien n'a été enregistré." : "Le titre et le résumé sont obligatoires."}
        </Banner>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`${card} flex items-center gap-3 p-4`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.tone}`}>
              <Icon name={s.icon} className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold leading-none text-slate-900">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ajout */}
      <details className="mb-6" open={total === 0}>
        <summary className={`${btnPrimary} w-full cursor-pointer list-none sm:w-fit [&::-webkit-details-marker]:hidden`}>
          <Icon name="plus" className="h-5 w-5" /> Nouveau projet
        </summary>
        <form action={addProject} className={`${card} mt-3 space-y-4 p-4 sm:p-6`}>
          <ProjectFields />
          <label className="flex min-h-11 items-center gap-2.5 rounded-xl bg-slate-50 px-3 text-sm font-medium text-slate-700">
            <input type="checkbox" name="published" defaultChecked className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
            Rendre visible tout de suite sur le site
          </label>
          <button type="submit" className={`${btnPrimary} w-full`}>
            Ajouter le projet
          </button>
        </form>
      </details>

      {/* Liste */}
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Mes projets ({total})</h2>
      <ul className="space-y-4">
        {total === 0 && (
          <li className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
            Aucun projet pour le moment. Clique sur « Nouveau projet » pour commencer.
          </li>
        )}

        {projects.map((p, idx) => {
          const techs = parseTech(p.tech);
          return (
            <li key={p.id} className={`${card} overflow-hidden ${p.published ? "" : "opacity-75"}`}>
              <div className="flex gap-3 p-4 sm:gap-4 sm:p-5">
                {p.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logo_url} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 bg-slate-50 object-contain p-1 sm:h-14 sm:w-14" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-bold text-slate-500 sm:h-14 sm:w-14">
                    {String(p.title).slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase ${p.category === "data" ? "bg-teal-50 text-teal-700" : "bg-violet-50 text-violet-700"}`}>
                      {p.category === "data" ? "Data" : "Web"}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${p.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${p.published ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {p.published ? "En ligne" : "Masqué"}
                    </span>
                    {p.demo_url && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">Lien actif</span>}
                  </div>
                  <h3 className="mt-1.5 text-base font-semibold text-slate-900">{p.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">{p.summary}</p>
                  {techs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {techs.map((t) => (
                        <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-3 py-2.5 sm:px-4">
                <form action={moveProject}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button type="submit" disabled={idx === 0} aria-label="Monter" title="Monter" className={iconBtn}>
                    <Icon name="up" className="h-4 w-4" />
                  </button>
                </form>
                <form action={moveProject}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button type="submit" disabled={idx === total - 1} aria-label="Descendre" title="Descendre" className={iconBtn}>
                    <Icon name="down" className="h-4 w-4" />
                  </button>
                </form>

                <form action={togglePublished}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className={iconBtn}>
                    <Icon name={p.published ? "eyeoff" : "eye"} className="h-4 w-4" />
                    {p.published ? "Masquer" : "Publier"}
                  </button>
                </form>

                <form action={deleteProject} className="ml-auto">
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmButton
                    message="Supprimer définitivement ce projet ?"
                    title="Supprimer"
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <Icon name="trash" className="h-4 w-4" /> Supprimer
                  </ConfirmButton>
                </form>
              </div>

              {/* Modification complète */}
              <details className="border-t border-slate-100">
                <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50/50 sm:px-5 [&::-webkit-details-marker]:hidden">
                  <Icon name="edit" className="h-4 w-4" /> Modifier ce projet
                </summary>
                <form action={updateProject} className="space-y-4 bg-slate-50/70 p-4 sm:p-5">
                  <input type="hidden" name="id" value={p.id} />
                  <ProjectFields p={p} />
                  <button type="submit" className={`${btnPrimary} w-full sm:w-auto`}>
                    Enregistrer les modifications
                  </button>
                </form>
              </details>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function AdminPage({ searchParams }: { searchParams: Promise<SP> }) {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-slate-400">Chargement…</div>}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}