"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-white">
      <h1 className="text-2xl font-bold sm:text-3xl">Oups, une erreur est survenue</h1>
      <p className="mt-3 max-w-sm text-sm text-slate-400">Réessaie dans un instant. Si le problème continue, reviens un peu plus tard.</p>
      <button onClick={reset} className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold transition hover:bg-indigo-500">
        Réessayer
      </button>
    </main>
  );
}
