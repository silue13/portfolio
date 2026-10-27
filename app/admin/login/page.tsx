import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/auth";

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }> | undefined;
}) {
  const resolved = searchParams ? await searchParams : {};
  const error = resolved?.error;

  async function action(formData: FormData) {
    "use server";
    const pwd = String(formData.get("password") ?? "");
    if (await login(pwd)) {
      redirect("/admin");
    }
    redirect("/admin/login?error=1");
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
          Mot de passe secret
        </label>
        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="••••••••••••"
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-center text-xs font-medium text-red-600">
          Mot de passe incorrect.
        </div>
      )}

      <button
        type="submit"
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.99]"
      >
        Accéder au panneau
      </button>
    </form>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">Espace Administration</h1>
          <p className="mt-1 text-xs text-slate-500">Connectez-vous pour mettre à jour vos projets.</p>
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