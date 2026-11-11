import { sql } from "@/lib/db";

// Sert le logo d'un projet publié comme une vraie image (mise en cache),
// au lieu d'intégrer le base64 dans le HTML de la page.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const rows = await sql`select logo_url from projects where id = ${id} and published = true and logo_url is not null`;
    const m = /^data:(image\/[\w.+-]+);base64,([\s\S]+)$/.exec(String(rows[0]?.logo_url ?? ""));
    if (!m) return new Response("Not found", { status: 404 });

    return new Response(Buffer.from(m[2], "base64"), {
      headers: {
        "Content-Type": m[1],
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}