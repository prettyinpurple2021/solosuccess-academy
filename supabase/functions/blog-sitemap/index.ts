/**
 * blog-sitemap — Serves a dynamic sitemap.xml that combines static routes
 * (from public/sitemap.xml's static set) with all published blog_posts rows.
 *
 * Public function (no auth required) — search engines fetch it.
 * Routed via Vercel rewrite: /sitemap.xml -> this function.
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE = "https://solosuccessacademy.app";

// Static URLs (matches what was in public/sitemap.xml minus the blog posts)
const STATIC_URLS: { loc: string; changefreq?: string; priority?: number }[] = [
  { loc: "/", changefreq: "weekly", priority: 1.0 },
  { loc: "/about", changefreq: "monthly", priority: 0.8 },
  { loc: "/courses", changefreq: "weekly", priority: 0.9 },
  { loc: "/pricing", changefreq: "monthly", priority: 0.8 },
  { loc: "/blog", changefreq: "weekly", priority: 0.8 },
  { loc: "/contact", changefreq: "monthly", priority: 0.5 },
  { loc: "/auth", changefreq: "monthly", priority: 0.3 },
];

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

Deno.serve(async () => {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: posts } = await admin
    .from("blog_posts")
    .select("slug, updated_at, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const urls = [
    ...STATIC_URLS.map((u) => ({
      loc: SITE + u.loc,
      lastmod: new Date().toISOString().slice(0, 10),
      changefreq: u.changefreq,
      priority: u.priority,
    })),
    ...(posts ?? []).map((p) => ({
      loc: `${SITE}/blog/${p.slug}`,
      lastmod: (p.updated_at ?? p.published_at)?.slice(0, 10),
      changefreq: "monthly" as const,
      priority: 0.7,
    })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n` +
          `    <loc>${xmlEscape(u.loc)}</loc>\n` +
          (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : "") +
          (u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>\n` : "") +
          (u.priority != null ? `    <priority>${u.priority.toFixed(1)}</priority>\n` : "") +
          `  </url>`,
      )
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});