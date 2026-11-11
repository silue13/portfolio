import { Suspense } from "react";
import Link from "next/link";
import { loginAction } from "@/app/admin/actions";

async function LoginForm({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <form action={loginAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
          Mot de passe secret
        </label>
        <input
          id="password"
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          placeholder="••••••••••••"
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 sm:text-sm"
        />
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-center text-xs font-medium text-red-600">
          Mot de passe incorrect.
        </div>
      )}

      <button
        type="submit"
        className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99]"
      >
        Accéder au panneau
      </button>
    </form>
  );
}

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <main className="bg-grid relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="pointer-events-none absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">Espace Administration</h1>
          <p className="mt-1 text-xs text-slate-500">Connectez-vous pour mettre à jour votre portfolio.</p>
        </div>

        <Suspense>
          <LoginForm searchParams={searchParams} />
        </Suspense>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <Link href="/" className="text-xs font-medium text-slate-400 hover:text-indigo-600">
            ← Retourner au site
          </Link>
        </div>
      </div>
    </main>
  );
}
