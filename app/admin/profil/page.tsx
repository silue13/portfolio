import { Suspense } from "react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { getProfile } from "@/lib/profile";

async function saveProfile(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");

  const f = (k: string) => String(formData.get(k) ?? "").trim();

  await sql`
    insert into profile (id, name, title, bio, email, phone, github, linkedin, skills)
    values (1, ${f("name")}, ${f("title")}, ${f("bio")}, ${f("email")}, ${f("phone")}, ${f("github")}, ${f("linkedin")}, ${f("skills")})
    on conflict (id) do update set
      name = excluded.name,
      title = excluded.title,
      bio = excluded.bio,
      email = excluded.email,
      phone = excluded.phone,
      github = excluded.github,
      linkedin = excluded.linkedin,
      skills = excluded.skills
  `;

  revalidatePath("/");
  revalidatePath("/admin/profil");
  redirect("/admin/profil?ok=1");
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600";

async function ProfileContent({ searchParams }: { searchParams: Promise<{ ok?: string }> | undefined }) {
  if (!(await isAdmin())) redirect("/admin/login");

  const resolved = searchParams ? await searchParams : {};
  const ok = resolved?.ok;
  const p = await getProfile();

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Link
              href="/admin"
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              ←
            </Link>
            <h1 className="text-sm font-bold text-slate-900 sm:text-base">Profil & Contact</h1>
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

      <main className="mx-auto max-w-4xl px-4 pt-6 sm:px-6 sm:pt-8">
        {ok && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800 sm:text-sm">
            <span>✓</span> Modifications enregistrées avec succès.
          </div>
        )}

        <form action={saveProfile} className="space-y-4 sm:space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="border-b border-slate-100 pb-2.5 text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-sm">
              1. Identité & Rôle
            </h2>
            <div className="mt-3.5 grid gap-3 sm:grid-cols-2 sm:gap-4">
              <div>
                <label className={labelClass}>Nom complet</label>
                <input name="name" defaultValue={p.name} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Intitulé de poste</label>
                <input name="title" defaultValue={p.title} className={inputClass} placeholder="Data Analyst & Développeur" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Bio / Accroche</label>
                <textarea
                  name="bio"
                  rows={3}
                  defaultValue={p.bio}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="border-b border-slate-100 pb-2.5 text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-sm">
              2. Coordonnées & Réseaux
            </h2>
            <div className="mt-3.5 grid gap-3 sm:grid-cols-2 sm:gap-4">
              <div>
                <label className={labelClass}>Adresse E-mail</label>
                <input name="email" type="email" defaultValue={p.email} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Numéro WhatsApp</label>
                <input name="phone" defaultValue={p.phone} placeholder="225XXXXXXXXXX" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>GitHub (lien)</label>
                <input name="github" type="url" defaultValue={p.github} placeholder="https://github.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>LinkedIn (lien)</label>
                <input name="linkedin" type="url" defaultValue={p.linkedin} placeholder="https://linkedin.com/in/..." className={inputClass} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="border-b border-slate-100 pb-2.5 text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-sm">
              3. Compétences
            </h2>
            <div className="mt-3.5">
              <label className={labelClass}>Compétences (séparées par une virgule)</label>
              <input
                name="skills"
                defaultValue={p.skills.join(", ")}
                placeholder="Python, SQL, Power BI, Excel, React"
                className={inputClass}
              />
              <p className="mt-1.5 text-[11px] text-slate-400">
                Les logos Devicon et pastilles de couleurs se génèrent automatiquement.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.99]"
          >
            Enregistrer le profil
          </button>
        </form>
      </main>
    </div>
  );
}

export default function ProfilPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Chargement…</div>}>
      <ProfileContent searchParams={searchParams} />
    </Suspense>
  );
}