import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

// AUTH_SECRET (conseillé) sert à signer la session ; à défaut on réutilise ADMIN_PASSWORD.
function secretKey() {
  const secret = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD;
  return secret ? new TextEncoder().encode(secret) : null;
}

const digest = (s: string) => createHash("sha256").update(s).digest();

function samePassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeEqual(digest(input), digest(expected));
}

export async function isAdmin(): Promise<boolean> {
  const key = secretKey();
  if (!key || !process.env.ADMIN_PASSWORD) return false;
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return false;
    await jwtVerify(token, key, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function login(password: string): Promise<boolean> {
  const key = secretKey();
  if (!key || !samePassword(password)) return false;

  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key);

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: MAX_AGE,
  });
  return true;
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}
