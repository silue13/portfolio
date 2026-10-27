import { sql } from "@/lib/db";

export interface Profile {
  name: string;
  title: string;
  bio: string;
  email: string;
  phone: string;
  github: string;
  linkedin: string;
  skills: string[];
}

export async function getProfile(): Promise<Profile> {
  let p: Record<string, any> = {};
  try {
    if (process.env.DATABASE_URL) {
      const rows = await sql`select * from profile where id = 1`;
      p = rows[0] ?? {};
    }
  } catch (e: any) {
    console.error("getProfile: base injoignable", e?.sourceError?.cause ?? e?.cause ?? e);
  }

  let skills: string[] = [];
  if (Array.isArray(p.skills)) {
    skills = p.skills;
  } else if (typeof p.skills === "string") {
    skills = p.skills
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  return {
    name: p.name || "Ton Nom",
    title: p.title || "Data analyst & développeur web",
    bio: p.bio || "",
    email: p.email || "",
    phone: p.phone || "",
    github: p.github || "",
    linkedin: p.linkedin || "",
    skills,
  };
}