import { Suspense } from "react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
  revalidatePath("/admin/projets");
  revalidatePath("/admin");
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

const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
const fileInput =
  "w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200";

async function Content() {
  if (!(await isAdmin())) redirect("/admin/login");
  let projects: any[] = [];
  try {
    projects = await sql`select * from projects order by position asc nulls last, created_at desc`;
  } catch (e) {
    console.error("Erreur chargement projets:", e);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-900">Projets</h1>
          <div className="flex gap-5 text-sm text-slate-600">
            <a href="/admin/profil" className="hover:text-slate-900">Profil</a>
            <a href="/admin/parcours" className="hover:text-slate-900">Parcours</a>
            <a href="/" className="hover:text-slate-900">Voir le site</a>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-6 py-10 lg:grid-cols-5">
        <section className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Ajouter un projet</h2>
            <form action={addProject} className="mt-5 space-y-4">
              <select name="category" className={input}>
                <option value="web">Web</option>
                <option value="data">Data</option>
              </select>
              <input name="title" required className={input} placeholder="Titre du projet" />
              <textarea name="summary" required rows={4} className={input} placeholder="Description" />
              <input name="tech" className={input} placeholder="Technologies (séparées par des virgules)" />

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Lien de l&apos;application (facultatif, laisse vide pour un projet interne)
                </label>
                <input name="demo_url" type="url" className={input} placeholder="https://..." />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Logo de l&apos;application (facultatif, 300 Ko max)
                </label>
                <input name="logo" type="file" accept="image/*" className={fileInput} />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="published" defaultChecked /> Publié sur le site
              </label>

              <button className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
                Ajouter
              </button>
            </form>
          </div>
        </section>

        <section className="lg:col-span-3">
          <h2 className="text-base font-semibold text-slate-900">
            Mes projets <span className="text-slate-400">({projects.length})</span>
          </h2>
          <ul className="mt-5 space-y-4">
            {projects.map((p: any) => (
              <li key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {p.logo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.logo_url}
                        alt=""
                        className="h-12 w-12 rounded-lg border border-slate-200 object-contain p-1"
                      />
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {p.category === "data" ? "Data" : "Web"}
                        </span>
                        {!p.published && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Masqué</span>
                        )}
                        {!p.demo_url && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Sans lien</span>
                        )}
                      </div>
                      <h3 className="mt-1.5 font-medium text-slate-900">{p.title}</h3>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <form action={togglePublished}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
                        {p.published ? "Masquer" : "Publier"}
                      </button>
                    </form>
                    <form action={deleteProject}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">Supprimer</button>
                    </form>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-indigo-600">
                    Modifier le lien / le logo
                  </summary>
                  <form action={updateProject} className="mt-3 space-y-3">
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      name="demo_url"
                      type="url"
                      defaultValue={p.demo_url ?? ""}
                      className={input}
                      placeholder="Lien (laisse vide si projet interne)"
                    />
                    <input name="logo" type="file" accept="image/*" className={fileInput} />
                    {p.logo_url && (
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" name="remove_logo" /> Supprimer le logo actuel
                      </label>
                    )}
                    <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
                      Enregistrer
                    </button>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-12 text-slate-500">Chargement…</p>}>
      <Content />
    </Suspense>
  );
}