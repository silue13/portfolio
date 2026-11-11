import type { ReactNode } from "react";

const ICONS: Record<string, string> = {
  folder: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
  mail: "M3 7l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21a8 8 0 0116 0",
  cap: "M12 3L2 8l10 5 10-5-10-5zM6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5",
  plus: "M12 5v14M5 12h14",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
  eyeoff: "M3 3l18 18M10.6 6.1A9.7 9.7 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.2M6.6 6.6A17 17 0 002 12s3.5 7 10 7a9.7 9.7 0 004.4-1M9.9 9.9a3 3 0 004.2 4.2",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3",
  up: "M5 15l7-7 7 7",
  down: "M19 9l-7 7-7-7",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
  external: "M14 4h6v6M20 4L10 14M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  check: "M5 13l4 4L19 7",
  chart: "M3 3v18h18M7 15l4-4 3 3 5-6",
  alert: "M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
};

export function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={ICONS[name] ?? ""} />
    </svg>
  );
}

/* ---------- styles partagés ---------- */
export const card = "rounded-2xl border border-slate-200/80 bg-white shadow-sm";
export const btnBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-2";
export const btnPrimary = `${btnBase} bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-violet-500`;
export const btnGhost = `${btnBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;
export const iconBtn =
  "inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";
export const fileClass =
  "w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3.5 file:py-2.5 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100";

/* ---------- composants ---------- */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

export function Banner({ kind, children }: { kind: "ok" | "error"; children: ReactNode }) {
  const ok = kind === "ok";
  return (
    <div
      role={ok ? "status" : "alert"}
      className={`mb-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${
        ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <Icon name={ok ? "check" : "alert"} className="h-4 w-4 shrink-0" />
      {children}
    </div>
  );
}

export function CardTitle({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <h2 className="text-sm font-bold text-slate-900 sm:text-base">{children}</h2>
    </div>
  );
}