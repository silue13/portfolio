import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

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
  revalidatePath("/admin/projets");
}

async function addProject(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const category = formData.get("category") === "data" ? "data" : "web";
  const demo = String(formData.get("demo_url") ?? "").trim() || null;
  const tech = String(formData.get("tech") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const published = formData.get("published") === "on";
  const logo = await fileToDataUrl(formData.get("logo"));

  await sql`
    insert into projects (title, category, summary, tech, demo_url, logo_url, published, position)
    values (${title}, ${category}, ${summary}, ${tech}::text[], ${demo}, ${logo}, ${published},
            (select coalesce(max(position), 0) + 1 from projects))
  `;
  refresh();
}

async function updateProject(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");

  const id = String(formData.get("id"));
  const demo = String(formData.get("demo_url") ?? "").trim() || null;
  const removeLogo = formData.get("remove_logo") === "on";
  const newLogo = await fileToDataUrl(formData.get("logo"));

  if (removeLogo) {
    await sql`update projects set demo_url = ${demo}, logo_url = null where id = ${id}`;
  } else if (newLogo) {
    await sql`update projects set demo_url = ${demo}, logo_url = ${newLogo} where id = ${id}`;
  } else {
    await sql`update projects set demo_url = ${demo} where id = ${id}`;
  }
  refresh();
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
}

async function logout() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete("admin");
  redirect("/admin/login");
}

function AdminNav({ current }: { current: "projets" | "profil" | "parcours" }) {
  const tabs = [
    { id: "projets", label: "Projets", href: "/admin" },
    { id: "profil", label: "Profil & Contact", href: "/admin/profil" },
    { id: "parcours", label: "Parcours", href: "/admin/parcours" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      {/* Barre supérieure */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm">
            AD
          </span>
          <span className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">Espace Admin</span>
        </div>

        {/* Liens Desktop */}
        <nav className="hidden items-center gap-1 sm:flex">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                current === tab.id
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {/* Actions rapides */}
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 sm:text-xs"
          >
            <span>Voir le site</span>
            <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 sm:text-xs"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>

      {/* Onglets tactiles Mobile */}
      <div className="flex border-t border-slate-100 px-4 py-2 sm:hidden overflow-x-auto gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              current === tab.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </header>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10";

async function DashboardContent() {
  if (!(await isAdmin())) redirect("/admin/login");

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
  const totalData = projects.filter((p) => p.category === "data").length;
  const totalWeb = projects.filter((p) => p.category === "web").length;
  const publishedCount = projects.filter((p) => p.published).length;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <AdminNav current="projets" />

      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        {/* En-tête */}
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Gestion des Réalisations</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Ajoutez, organisez et ajustez la visibilité de vos projets sur votre portfolio.
          </p>

          {/* Métriques */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:rounded-2xl sm:p-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">Total</span>
              <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{total}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:rounded-2xl sm:p-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 sm:text-xs">En Ligne</span>
              <p className="mt-1 text-xl font-bold text-emerald-600 sm:text-2xl">{publishedCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:rounded-2xl sm:p-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">Projets Data</span>
              <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{totalData}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:rounded-2xl sm:p-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">Projets Web</span>
              <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{totalWeb}</p>
            </div>
          </div>
        </div>

        {/* Grille Formulaire / Liste */}
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Formulaire d'ajout */}
          <section className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm">
                  +
                </span>
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Nouveau projet</h3>
              </div>

              <form action={addProject} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Titre du projet
                  </label>
                  <input
                    name="title"
                    required
                    placeholder="Ex: Analyse Prédictive du Churn"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Catégorie
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-700 transition has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 has-[:checked]:text-indigo-700">
                      <input type="radio" name="category" value="data" defaultChecked className="hidden" />
                      <span>📊 Data</span>
                    </label>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-700 transition has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 has-[:checked]:text-indigo-700">
                      <input type="radio" name="category" value="web" className="hidden" />
                      <span>💻 Web</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Résumé synthétique
                  </label>
                  <textarea
                    name="summary"
                    required
                    rows={3}
                    placeholder="2 à 3 phrases décrivant le projet..."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Technologies
                  </label>
                  <input
                    name="tech"
                    placeholder="Python, SQL, Power BI"
                    className={inputClass}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Séparez par des virgules.</p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Lien interactif (optionnel)
                  </label>
                  <input
                    name="demo_url"
                    type="url"
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Logo / Icône (max 300 Ko)
                  </label>
                  <input
                    name="logo"
                    type="file"
                    accept="image/*"
                    className="w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                  />
                </div>

                <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3">
                  <input
                    type="checkbox"
                    id="published"
                    name="published"
                    defaultChecked
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="published" className="cursor-pointer text-xs font-medium text-slate-700">
                    Rendre immédiatement visible sur le site
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.99]"
                >
                  Ajouter le projet
                </button>
              </form>
            </div>
          </section>

          {/* Liste des projets */}
          <section className="lg:col-span-7">
            <h3 className="mb-3 font-semibold text-slate-900 text-sm sm:text-base">
              Projets enregistrés <span className="text-slate-400">({projects.length})</span>
            </h3>

            <ul className="space-y-3">
              {projects.length === 0 && (
                <li className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-400 sm:text-sm">
                  Aucun projet enregistré. Remplissez le formulaire pour débuter.
                </li>
              )}

              {projects.map((p) => (
                <li
                  key={p.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      {p.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.logo_url}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-slate-50 object-contain p-1 sm:h-12 sm:w-12"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-400 sm:h-12 sm:w-12 sm:text-sm">
                          {p.title.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase sm:px-2 sm:text-[11px] ${
                              p.category === "data"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-indigo-50 text-indigo-700"
                            }`}
                          >
                            {p.category === "data" ? "Data" : "Web"}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:text-[11px] ${
                              p.published
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${p.published ? "bg-emerald-500" : "bg-amber-500"}`} />
                            {p.published ? "En ligne" : "Masqué"}
                          </span>
                        </div>

                        <h4 className="mt-1 truncate font-semibold text-slate-900 text-sm sm:text-base">{p.title}</h4>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500 leading-relaxed">{p.summary}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1">
                      <form action={togglePublished}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          title={p.published ? "Masquer" : "Publier"}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                        >
                          {p.published ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </form>

                      <form action={deleteProject}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          title="Supprimer"
                          className="rounded-lg border border-transparent p-2 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Accordéon mobile-friendly */}
                  <details className="mt-3 border-t border-slate-100 pt-3">
                    <summary className="flex cursor-pointer items-center justify-between text-xs font-medium text-slate-500 hover:text-indigo-600">
                      <span>Modifier lien ou logo</span>
                      <span className="text-[10px] text-slate-400">Éditer ▾</span>
                    </summary>
                    <form action={updateProject} className="mt-3 space-y-3 rounded-xl bg-slate-50/70 p-3">
                      <input type="hidden" name="id" value={p.id} />
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">Lien interactif</label>
                        <input
                          name="demo_url"
                          type="url"
                          defaultValue={p.demo_url ?? ""}
                          placeholder="https://..."
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">Remplacer le logo</label>
                        <input name="logo" type="file" accept="image/*" className="w-full text-xs text-slate-500" />
                      </div>
                      {p.logo_url && (
                        <label className="flex items-center gap-2 text-xs text-slate-600">
                          <input type="checkbox" name="remove_logo" className="h-3.5 w-3.5 text-indigo-600" />
                          Supprimer le logo actuel
                        </label>
                      )}
                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="w-full rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 sm:w-auto sm:px-4"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 text-xs text-slate-500">Chargement…</div>}>
      <DashboardContent />
    </Suspense>
  );
}