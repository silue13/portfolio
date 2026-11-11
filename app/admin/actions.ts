"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const pwd = String(formData.get("password") ?? "");
  if (await login(pwd)) redirect("/admin");
  // petite pause pour freiner les essais en rafale
  await new Promise((r) => setTimeout(r, 800));
  redirect("/admin/login?error=1");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}
