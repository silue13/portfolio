/** Accepte seulement les liens http(s). Ajoute https:// si absent. Renvoie null sinon. */
export function safeUrl(u?: string | null): string | null {
  const v = (u ?? "").trim();
  if (!v) return null;
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const url = new URL(withProto);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export const displayUrl = (u: string) =>
  u.replace(/^https?:\/\/(www\.)?/i, "").split(/[?#]/)[0].replace(/\/$/, "");

export function formatPeriod(start: number | null, end: number | null) {
  if (start && end) return start === end ? `${start}` : `${start} – ${end}`;
  if (start) return `${start} – présent`;
  if (end) return `${end}`;
  return "";
}

export function parseTech(t: unknown): string[] {
  if (Array.isArray(t)) return t.map(String);
  if (typeof t === "string") {
    return t.replace(/^\{|\}$/g, "").split(",").map((x) => x.replace(/^"|"$/g, "").trim()).filter(Boolean);
  }
  return [];
}

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10";

/** "Dashboard des ventes" -> "dashboard-des-ventes" */
export function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "projet"
  );
}