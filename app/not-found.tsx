import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-white">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Erreur 404</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Page introuvable</h1>
      <p className="mt-3 max-w-sm text-sm text-slate-400">Cette page n&apos;existe pas ou a été déplacée.</p>
      <Link href="/" className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold transition hover:bg-indigo-500">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
