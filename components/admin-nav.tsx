"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";
import { Icon } from "@/components/admin-ui";

const tabs = [
  { href: "/admin", label: "Projets", icon: "folder" },
  { href: "/admin/messages", label: "Messages", icon: "mail" },
  { href: "/admin/profil", label: "Profil", icon: "user" },
  { href: "/admin/parcours", label: "Parcours", icon: "cap" },
];

export default function AdminNav({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <>
      {/* ----- Barre latérale (ordinateur) ----- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-slate-950 p-4 lg:flex">
        <div className="flex items-center gap-3 px-2 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
            AD
          </span>
          <div>
            <p className="text-sm font-bold text-white">Espace Admin</p>
            <p className="text-xs text-slate-500">Gère ton portfolio</p>
          </div>
        </div>

        <nav aria-label="Navigation admin" className="mt-6 flex-1 space-y-1">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive(t.href) ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon name={t.icon} className={`h-5 w-5 ${isActive(t.href) ? "text-indigo-400" : ""}`} />
              <span className="flex-1">{t.label}</span>
              {t.href === "/admin/messages" && unread > 0 && (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">{unread}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="space-y-1 border-t border-white/10 pt-4">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white">
            <Icon name="external" className="h-5 w-5" /> Voir le site
          </a>
          <form action={logoutAction}>
            <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400">
              <Icon name="logout" className="h-5 w-5" /> Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* ----- Barre du haut (téléphone) ----- */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-slate-950 px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold">AD</span>
          <span className="text-sm font-bold">Espace Admin</span>
        </div>
        <div className="flex items-center gap-1">
          <a href="/" target="_blank" rel="noopener noreferrer" aria-label="Voir le site" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10">
            <Icon name="external" className="h-5 w-5" />
          </a>
          <form action={logoutAction}>
            <button type="submit" aria-label="Déconnexion" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-red-400">
              <Icon name="logout" className="h-5 w-5" />
            </button>
          </form>
        </div>
      </header>

      {/* ----- Barre du bas (téléphone) : navigation au pouce ----- */}
      <nav aria-label="Navigation admin mobile" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
              isActive(t.href) ? "text-indigo-600" : "text-slate-500"
            }`}
          >
            <Icon name={t.icon} className="h-6 w-6" />
            {t.label}
            {t.href === "/admin/messages" && unread > 0 && (
              <span className="absolute right-[22%] top-1.5 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{unread}</span>
            )}
          </Link>
        ))}
      </nav>
    </>
  );
}
