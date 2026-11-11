import { Suspense } from "react";
import { connection } from "next/server";
import { sql } from "@/lib/db";
import { getProfile } from "@/lib/profile";
import { displayUrl, formatPeriod, parseTech, safeUrl } from "@/lib/utils";
import type { Item, Project } from "@/lib/types";
import ProjectsGrid from "@/components/projects-grid";
import ContactForm from "@/components/contact-form";

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-6 sm:mb-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 sm:text-sm">{label}</p>
      <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:mt-2 sm:text-3xl">{title}</h2>
      <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400" />
    </div>
  );
}

/* ---------- Icônes des compétences ---------- */

type SkillIconInfo =
  | { kind: "img"; src: string }
  | { kind: "badge"; text: string; bg: string; fg: string };

const devicon = (slug: string) =>
  `https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/${slug}/${slug}-original.svg`;

const img = (slug: string): SkillIconInfo => ({ kind: "img", src: devicon(slug) });
const badge = (text: string, bg: string, fg = "#ffffff"): SkillIconInfo => ({ kind: "badge", text, bg, fg });

const SKILL_ICONS: Record<string, SkillIconInfo> = {
  python: img("python"),
  html: img("html5"),
  html5: img("html5"),
  css: img("css3"),
  css3: img("css3"),
  javascript: img("javascript"),
  js: img("javascript"),
  typescript: img("typescript"),
  ts: img("typescript"),
  react: img("react"),
  nextjs: img("nextjs"),
  nodejs: img("nodejs"),
  node: img("nodejs"),
  postgresql: img("postgresql"),
  postgres: img("postgresql"),
  mysql: img("mysql"),
  git: img("git"),
  github: img("github"),
  docker: img("docker"),
  r: img("r"),
  tailwind: img("tailwindcss"),
  tailwindcss: img("tailwindcss"),
  figma: img("figma"),
  php: img("php"),
  jupyter: img("jupyter"),
  pandas: img("pandas"),
  numpy: img("numpy"),
  supabase: img("supabase"),
  vscode: img("vscode"),

  excel: badge("X", "#217346"),
  powerquery: badge("PQ", "#0E7A6B"),
  powerbi: badge("BI", "#F2C811", "#1f2937"),
  sql: badge("SQL", "#475569"),
  word: badge("W", "#2B579A"),
  powerpoint: badge("P", "#D24726"),
  googlesheets: badge("GS", "#0F9D58"),
  appsscript: badge("AS", "#4285F4"),
  googleappsscript: badge("AS", "#4285F4"),
  tableau: badge("T", "#E97627"),
  spss: badge("SPSS", "#1F4E79"),
  stata: badge("St", "#1A5F8A"),
  eviews: badge("EV", "#7C3AED"),
};

function normalizeSkill(name: string) {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getSkillIcon(name: string): SkillIconInfo {
  const known = SKILL_ICONS[normalizeSkill(name)];
  if (known) return known;
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  const initials =
    words.length > 1
      ? (words[0][0] + words[1][0]).toUpperCase()
      : (name || "").trim().slice(0, 2).toUpperCase();
  return { kind: "badge", text: initials || "?", bg: "#E0E7FF", fg: "#4338CA" };
}

function SkillChip({ name }: { name: string }) {
  const icon = getSkillIcon(name);
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3.5 text-xs sm:text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {icon.kind === "img" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon.src} alt="" loading="lazy" className="h-5 w-5 sm:h-6 sm:w-6 object-contain" />
      ) : (
        <span
          className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md px-1 text-[9px] sm:text-[10px] font-bold leading-none"
          style={{ backgroundColor: icon.bg, color: icon.fg }}
        >
          {icon.text}
        </span>
      )}
      {name}
    </span>
  );
}

/* ---------- Logos de contact ---------- */

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function ContactCard({
  href,
  icon,
  label,
  value,
  color,
  external = true,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex items-center gap-3.5 sm:gap-4 rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-3.5 sm:p-4 text-left transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10"
    >
      <span className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl ${color}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <span className="block truncate text-xs sm:text-sm font-medium text-white">{value}</span>
      </span>
    </a>
  );
}

/* ---------- Sections dynamiques ---------- */

async function ProjectsList() {
  await connection();
  let projects: Project[] = [];
  try {
    const rows = await sql`
      select id, title, category, summary, tech, demo_url,
             (logo_url is not null) as has_logo, coalesce(length(logo_url), 0) as logo_v
      from projects
      where published = true
      order by position asc nulls last, created_at desc
    `;
    projects = rows.map((r): Project => ({
      id: String(r.id),
      title: String(r.title),
      category: r.category === "data" ? "data" : "web",
      summary: String(r.summary ?? ""),
      tech: parseTech(r.tech),
      demo_url: safeUrl(r.demo_url),
      logo_src: r.has_logo ? `/api/logo/${r.id}?v=${r.logo_v}` : null,
    }));
  } catch (error) {
    console.error("Erreur chargement projets:", error);
  }

  if (projects.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 sm:text-sm">
        Les projets arrivent bientôt.
      </p>
    );
  }

  return <ProjectsGrid projects={projects} />;
}

async function Parcours() {
  await connection();
  let items: Item[] = [];
  try {
    items = (await sql`
      select * from education
      order by end_year desc nulls first, start_year desc nulls last
    `) as Item[];
  } catch (error) {
    console.error("Erreur chargement parcours:", error);
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 sm:text-sm">
        Le parcours sera bientôt détaillé.
      </p>
    );
  }

  return (
    <ul className="relative ml-2 space-y-6 border-l-2 border-indigo-200 pl-4 sm:ml-4 sm:space-y-8 sm:pl-8">
      {items.map((i) => {
        const period = formatPeriod(i.start_year, i.end_year);
        return (
          <li key={i.id} className="relative">
            <span className="absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-indigo-600 shadow sm:-left-[39px] sm:h-4 sm:w-4 sm:border-4" />
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:rounded-2xl sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 sm:text-xs">
                  {i.kind === "diplome" ? "Diplôme" : "Formation"}
                </span>
                {period && <span className="text-[11px] font-medium text-slate-500 sm:text-xs">{period}</span>}
              </div>
              <h3 className="mt-2 text-sm font-semibold text-slate-900 sm:text-base">{i.title}</h3>
              <p className="text-xs text-slate-600 sm:text-sm">{i.school}</p>
              {i.description && <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">{i.description}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6" aria-hidden="true">
      {[1, 2].map((n) => (
        <div key={n} className="h-44 animate-pulse rounded-2xl bg-slate-200 sm:h-48" />
      ))}
    </div>
  );
}

async function HomeContent() {
  await connection();
  const profile = await getProfile();
  const { name: NAME, title: TITLE, bio: BIO, email: EMAIL, skills: SKILLS } = profile;

  const phoneDigits = profile.phone.replace(/\D/g, "");
  const github = safeUrl(profile.github);
  const linkedin = safeUrl(profile.linkedin);
  const hasContacts = Boolean(EMAIL || phoneDigits || github || linkedin);
  const initials =
    NAME.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "P";

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <a
        href="#projets"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900"
      >
        Aller au contenu
      </a>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <nav aria-label="Navigation principale" className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5">
          <a href="#accueil" className="flex items-center gap-2.5 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-bold shadow">
              {initials}
            </span>
            <span className="max-w-[10rem] truncate text-xs font-bold tracking-wide sm:max-w-none sm:text-sm">{NAME}</span>
          </a>
          <div className="flex items-center gap-4 text-xs text-slate-300 sm:gap-6 sm:text-sm">
            <a href="#projets" className="transition hover:text-white">Projets</a>
            <a href="#parcours" className="transition hover:text-white">Parcours</a>
            <a href="#contact" className="rounded-lg bg-white/10 px-3 py-1.5 font-medium text-white transition hover:bg-white/20">Contact</a>
          </div>
        </nav>
      </header>

      <main>
        {/* Accueil */}
        <section id="accueil" className="bg-grid relative overflow-hidden bg-slate-950 text-white">
          <div className="pointer-events-none absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-indigo-600/30 blur-3xl sm:h-96 sm:w-96" />
          <div className="pointer-events-none absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl sm:h-96 sm:w-96" />

          <div className="animate-fade-up relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-slate-300 sm:text-xs">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Disponible pour de nouveaux projets
            </p>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Salut, je suis{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">{NAME}</span>
            </h1>

            <p className="mt-3 text-base font-medium text-slate-300 sm:text-xl">{TITLE}</p>
            {BIO && <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400">{BIO}</p>}

            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <a href="#projets" className="w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-[0.99] sm:w-auto">
                Voir mes projets
              </a>
              <a href="#contact" className="w-full rounded-xl border border-white/20 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[0.99] sm:w-auto">
                Me contacter
              </a>
            </div>
          </div>
        </section>

        {/* Compétences */}
        {SKILLS.length > 0 && (
          <section aria-label="Compétences" className="border-b border-slate-200 bg-slate-50">
            <div className="mx-auto max-w-5xl px-4 py-8 text-center sm:px-6 sm:py-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Technologies & outils</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {SKILLS.map((s) => (
                  <SkillChip key={s} name={s} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Projets */}
        <section id="projets" className="mx-auto max-w-5xl scroll-mt-16 px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
          <SectionTitle label="Réalisations" title="Mes projets" />
          <Suspense fallback={<Skeleton />}>
            <ProjectsList />
          </Suspense>
        </section>

        {/* Parcours */}
        <section id="parcours" className="scroll-mt-16 bg-slate-50 py-14 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionTitle label="Formation" title="Parcours & formations" />
            <Suspense fallback={<Skeleton />}>
              <Parcours />
            </Suspense>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="scroll-mt-16 bg-slate-950 py-14 text-white sm:py-20 lg:py-24">
          <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 sm:text-sm">Contact</p>
              <h2 className="mt-1.5 text-2xl font-bold sm:mt-2 sm:text-3xl">Travaillons ensemble</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Un projet data, une application web ou une question ? Écris-moi via le formulaire ou directement sur l&apos;un de ces canaux.
              </p>

              {hasContacts && (
                <div className="mt-8 grid gap-3">
                  {EMAIL && (
                    <ContactCard href={`mailto:${EMAIL}`} external={false} icon={<MailIcon />} label="E-mail" value={EMAIL} color="bg-indigo-500/20 text-indigo-300" />
                  )}
                  {phoneDigits && (
                    <ContactCard href={`https://wa.me/${phoneDigits}`} icon={<WhatsAppIcon />} label="WhatsApp" value={`+${phoneDigits}`} color="bg-emerald-500/20 text-emerald-300" />
                  )}
                  {github && (
                    <ContactCard href={github} icon={<GithubIcon />} label="GitHub" value={displayUrl(github)} color="bg-slate-500/20 text-slate-200" />
                  )}
                  {linkedin && (
                    <ContactCard href={linkedin} icon={<LinkedinIcon />} label="LinkedIn" value={displayUrl(linkedin)} color="bg-sky-500/20 text-sky-300" />
                  )}
                </div>
              )}
            </div>

            <ContactForm />
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950 py-6 text-center text-[11px] text-slate-500 sm:text-xs">
        <p>© {new Date().getFullYear()} {NAME}. Tous droits réservés.</p>
        <a href="#accueil" className="mt-1 inline-block transition hover:text-slate-300">↑ Haut de page</a>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <HomeContent />
    </Suspense>
  );
}
