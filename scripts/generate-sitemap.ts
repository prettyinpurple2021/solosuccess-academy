// Runs before `vite dev` and `vite build` (predev/prebuild hooks).
// Writes public/sitemap.xml using the curriculum as the source of truth
// for course detail routes so the sitemap stays in sync when courses
// are added or renamed in src/lib/curriculumData.ts.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { curriculumCourses } from "../src/lib/curriculumData";
import { LEGAL_DOCUMENTS } from "../src/lib/legalDocuments";

const BASE_URL = "https://solosuccessacademy.app";

interface SitemapEntry {
  path: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
}

// Static public routes (mirrors src/App.tsx PublicLayout routes).
const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/courses", changefreq: "weekly", priority: "0.9" },
  { path: "/auth", changefreq: "monthly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  // Help Center hosts the long-form FAQ content for students.
  { path: "/help", changefreq: "monthly", priority: "0.6" },
  { path: "/verify", changefreq: "monthly", priority: "0.5" },
  { path: "/legal", changefreq: "yearly", priority: "0.4" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/refund", changefreq: "yearly", priority: "0.3" },
];

// Dynamic course detail routes pulled from the curriculum source of truth.
const courseEntries: SitemapEntry[] = curriculumCourses.map((c) => ({
  path: `/courses/${c.courseId}`,
  changefreq: "weekly",
  priority: "0.8",
}));

const entries: SitemapEntry[] = [...staticEntries, ...courseEntries];

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);