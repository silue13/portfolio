import { Suspense } from "react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { inputClass, safeUrl } from "@/lib/utils";
import { Banner, CardTitle, Field, Icon, PageHeader, btnPrimary, card } from "@/components/admin-ui";

async function saveProfile(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin/login");

  const f = (k: string) => String(formData.get(k) ?? "").trim();
  const phone = f("phone").replace(/[^\d]/g, "");

  await sql`
    insert into profile (id, name, title, bio, email, phone, github, linkedin, skills)
    values (1, ${f("name")}, ${f("title")}, ${f("bio")}, ${f("email")}, ${phone}, ${safeUrl(f("github")) ?? ""}, ${safeUrl(f("linkedin")) ?? ""}, ${f("skills")})
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

async function ProfileContent({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { ok } = await searchParams;
  const p = await getProfile();

  return (
    <>
      <PageHeader title="Profil & Contact" subtitle="Ces informations s'affichent en haut de ton site et dans la section contact." />
      {ok && <Banner kind="ok">Modifications enregistrées avec succès.</Banner>}

      <form action={saveProfile} className="space-y-5">
        <section className={`${card} p-4 sm:p-6`}>
          <CardTitle icon="user">Identité</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom complet">
              <input name="name" defaultValue={p.name} required className={inputClass} />
            </Field>
            <Field label="Intitulé de poste">
              <input name="title" defaultValue={p.title} placeholder="Data Analyst & Développeur web" className={inputClass} />
            </Field>
            <Field label="Bio / accroche" className="sm:col-span-2" hint="2 ou 3 phrases : qui tu es et ce que tu proposes.">
              <textarea name="bio" rows={4} defaultValue={p.bio} className={inputClass} />
            </Field>
          </div>
        </section>

        <section className={`${card} p-4 sm:p-6`}>
          <CardTitle icon="mail">Coordonnées & réseaux</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Adresse e-mail">
              <input name="email" type="email" defaultValue={p.email} className={inputClass} />
            </Field>
            <Field label="Numéro WhatsApp" hint="Avec l'indicatif, sans le + : 2250585764077">
              <input name="phone" inputMode="numeric" defaultValue={p.phone} placeholder="225XXXXXXXXXX" className={inputClass} />
            </Field>
            <Field label="GitHub">
              <input name="github" defaultValue={p.github} placeholder="github.com/ton-pseudo" className={inputClass} />
            </Field>
            <Field label="LinkedIn">
              <input name="linkedin" defaultValue={p.linkedin} placeholder="linkedin.com/in/ton-profil" className={inputClass} />
            </Field>
          </div>
        </section>

        <section className={`${card} p-4 sm:p-6`}>
          <CardTitle icon="chart">Compétences</CardTitle>
          <Field label="Liste de compétences" hint="Sépare par des virgules. Les logos (Python, React, Power BI, Excel…) s'ajoutent automatiquement.">
            <input name="skills" defaultValue={p.skills.join(", ")} placeholder="Python, SQL, Power BI, Excel, React" className={inputClass} />
          </Field>
          {p.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.skills.map((s) => (
                <span key={s} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">{s}</span>
              ))}
            </div>
          )}
        </section>

        <div className="sticky bottom-20 z-10 lg:bottom-4">
          <button type="submit" className={`${btnPrimary} w-full shadow-xl`}>
            <Icon name="check" className="h-5 w-5" /> Enregistrer le profil
          </button>
        </div>
      </form>
    </>
  );
}

export default function ProfilPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-slate-400">Chargement…</div>}>
      <ProfileContent searchParams={searchParams} />
    </Suspense>
  );
}
