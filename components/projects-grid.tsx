"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";

type Filter = "all" | "data" | "web";

function ProjectCard({ p }: { p: Project }) {
  const isData = p.category === "data";
  const hasLink = Boolean(p.demo_url);

  const content = (
    <>
      <div className={`h-1.5 ${isData ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"}`} />
      <div className="flex flex-1 flex-col p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className={`w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:text-xs ${isData ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"}`}>
            {isData ? "Data" : "Web"}
          </span>
          {p.logo_src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.logo_src}
              alt={`Logo ${p.title}`}
              loading="lazy"
              width={56}
              height={48}
              className="h-10 w-10 rounded-xl border border-slate-200 bg-white object-contain p-1 shadow-sm sm:h-12 sm:w-14"
            />
          )}
        </div>
        <h3 className="mt-3 text-lg font-semibold text-slate-900 sm:mt-4 sm:text-xl">{p.title}</h3>
        <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-600 sm:text-sm">{p.summary}</p>
        <div className="mt-4 flex flex-wrap gap-1.5 sm:gap-2">
          {p.tech.map((t) => (
            <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 sm:py-1 sm:text-xs">
              {t}
            </span>
          ))}
        </div>
        {hasLink && (
          <span className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-medium text-white transition group-hover:bg-indigo-600 sm:mt-6 sm:w-fit sm:text-sm">
            Tester l&apos;application <span className="transition group-hover:translate-x-1">→</span>
          </span>
        )}
      </div>
    </>
  );

  const base = "group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm";

  return hasLink ? (
    <a href={p.demo_url!} target="_blank" rel="noopener noreferrer" className={`${base} transition duration-300 hover:-translate-y-1 hover:shadow-xl`}>
      {content}
    </a>
  ) : (
    <div className={base}>{content}</div>
  );
}

export default function ProjectsGrid({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const count = (f: Filter) => (f === "all" ? projects.length : projects.filter((p) => p.category === f).length);
  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: "Tous" },
    { id: "data", label: "Data" },
    { id: "web", label: "Web" },
  ];
  const visible = filter === "all" ? projects : projects.filter((p) => p.category === filter);

  return (
    <>
      {/* le filtre n'apparaît que s'il y a vraiment 2 catégories à trier */}
      {count("data") > 0 && count("web") > 0 && (
        <div role="tablist" aria-label="Filtrer les projets" className="mb-6 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={filter === t.id}
              onClick={() => setFilter(t.id)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition sm:text-sm ${
                filter === t.id
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {t.label} <span className="opacity-70">({count(t.id)})</span>
            </button>
          ))}
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        {visible.map((p) => (
          <li key={p.id}>
            <ProjectCard p={p} />
          </li>
        ))}
      </ul>
    </>
  );
}
