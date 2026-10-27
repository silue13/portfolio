import { cookies } from "next/headers";
import { createHash } from "crypto";

const token = () => {
  const secret = process.env.ADMIN_PASSWORD || "";
  return createHash("sha256").update(secret).digest("hex");
};

export async function isAdmin(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  try {
    const cookieStore = await cookies();
    return cookieStore.get("admin")?.value === token();
  } catch {
    return false;
  }
}

export async function login(password: string): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return false;
  }
  const cookieStore = await cookies();
  cookieStore.set("admin", token(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
  return true;
}