import type { Metadata } from "next";
import { Suspense } from "react";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import AdminNav from "@/components/admin-nav";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

async function Shell({ children }: { children: React.ReactNode }) {
  // page de connexion : pas de menu
  if (!(await isAdmin())) return <>{children}</>;

  let unread = 0;
  try {
    const rows = await sql`select count(*)::int as n from contact_messages where read = false`;
    unread = Number(rows[0]?.n ?? 0);
  } catch {
    // table pas encore créée : pas de pastille
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <AdminNav unread={unread} />
      <div className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-10">{children}</div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
