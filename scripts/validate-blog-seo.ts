/**
 * @file validate-blog-seo.ts — Automated SEO validation for blog posts.
 *
 * Runs three categories of checks and exits non-zero on failure so it
 * can be wired into CI later.
 *
 *   1. METADATA   — Every post in src/content/blog/posts.tsx must have
 *                   a valid title, metaTitle (<60), description (50-160),
 *                   excerpt, publishedAt, readingMinutes, FAQ items,
 *                   and tags.
 *   2. SITEMAP    — Every post slug must appear in public/sitemap.xml
 *                   under `/blog/<slug>`. Flags stale entries too
 *                   (sitemap URLs that no longer exist in the registry).
 *   3. LIVENESS   — HEAD/GET each published URL, verify 200 + that the
 *                   rendered HTML contains the post's <title> and a
 *                   matching <link rel="canonical">. Catches deploys
 *                   that drifted from the registry.
 *   4. INDEXING   — Optional. If LOVABLE_API_KEY and
 *                   GOOGLE_SEARCH_CONSOLE_API_KEY are present in the
 *                   environment, query Google Search Console to check
 *                   whether each post has received any impressions.
 *                   No impressions over the last 28 days = likely not
 *                   indexed yet.
 *
 * Usage:
 *   bun run validate:blog-seo             # all checks against prod
 *   bun run validate:blog-seo --base=...  # check a preview deploy
 *   bun run validate:blog-seo --no-live   # skip the HTTP fetch step
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

/* ────────────────────────────────────────────────────────────── */
/* CLI args                                                       */
/* ────────────────────────────────────────────────────────────── */

const args = process.argv.slice(2);
const baseArg = args.find((a) => a.startsWith('--base='));
const BASE_URL =
  (baseArg ? baseArg.slice('--base='.length) : 'https://solosuccessacademy.app').replace(/\/$/, '');
const SKIP_LIVE = args.includes('--no-live');
const SKIP_INDEXING = args.includes('--no-indexing');

/* ────────────────────────────────────────────────────────────── */
/* Result tracking                                                */
/* ────────────────────────────────────────────────────────────── */

type Severity = 'error' | 'warn' | 'info';
interface Finding {
  severity: Severity;
  category: string;
  slug?: string;
  message: string;
}
const findings: Finding[] = [];
const record = (f: Finding) => findings.push(f);

const c = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

/* ────────────────────────────────────────────────────────────── */
/* 1. Parse blog post metadata directly from posts.tsx            */
/*    We avoid importing the .tsx (which pulls React + router)    */
/*    and instead extract each post entry with a tolerant regex.  */
/* ────────────────────────────────────────────────────────────── */

interface PostMeta {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  excerpt: string;
  publishedAt: string;
  readingMinutes: number;
  tags: string[];
  faqCount: number;
}

function parsePosts(): PostMeta[] {
  const src = readFileSync(resolve('src/content/blog/posts.tsx'), 'utf8');

  // Slice the BLOG_POSTS array literal (matches the outer `[ ... ];`)
  const arrayMatch = src.match(/export const BLOG_POSTS:\s*BlogPost\[\]\s*=\s*\[([\s\S]*?)\n\];/);
  if (!arrayMatch) {
    throw new Error('Could not locate BLOG_POSTS array in posts.tsx');
  }

  // Split into top-level entries by tracking brace depth.
  const body = arrayMatch[1];
  const entries: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '{') {
      if (depth === 0) current = '';
      depth++;
    }
    if (depth > 0) current += ch;
    if (ch === '}') {
      depth--;
      if (depth === 0) entries.push(current);
    }
  }

  return entries.map((raw) => {
    const pick = (key: string): string | undefined => {
      // Matches `key: 'value'` or `key: "value"` allowing escaped quotes.
      const m = raw.match(new RegExp(`\\b${key}\\s*:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`));
      return m ? m[2].replace(/\\'/g, "'").replace(/\\"/g, '"') : undefined;
    };
    const tagsMatch = raw.match(/\btags\s*:\s*\[([^\]]*)\]/);
    const tags = tagsMatch
      ? Array.from(tagsMatch[1].matchAll(/['"`]([^'"`]+)['"`]/g)).map((m) => m[1])
      : [];
    const faqMatches = raw.match(/\bfaq\s*:\s*\[([\s\S]*?)\n\s*\]/);
    const faqCount = faqMatches
      ? (faqMatches[1].match(/\bq\s*:/g) ?? []).length
      : 0;
    const readingStr = raw.match(/\breadingMinutes\s*:\s*(\d+)/)?.[1] ?? '0';

    return {
      slug: pick('slug') ?? '',
      title: pick('title') ?? '',
      metaTitle: pick('metaTitle') ?? '',
      description: pick('description') ?? '',
      excerpt: pick('excerpt') ?? '',
      publishedAt: pick('publishedAt') ?? '',
      readingMinutes: Number(readingStr),
      tags,
      faqCount,
    };
  });
}

/* ────────────────────────────────────────────────────────────── */
/* 2. Metadata validation                                         */
/* ────────────────────────────────────────────────────────────── */

function validateMetadata(posts: PostMeta[]) {
  const seenSlugs = new Set<string>();

  for (const p of posts) {
    const slug = p.slug || '(missing)';

    if (!p.slug) {
      record({ severity: 'error', category: 'metadata', message: 'Post missing slug', slug });
      continue;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) {
      record({
        severity: 'error',
        category: 'metadata',
        slug,
        message: `Slug "${p.slug}" is not URL-safe (lowercase letters, numbers, hyphens only)`,
      });
    }
    if (seenSlugs.has(p.slug)) {
      record({ severity: 'error', category: 'metadata', slug, message: 'Duplicate slug' });
    }
    seenSlugs.add(p.slug);

    if (!p.title) record({ severity: 'error', category: 'metadata', slug, message: 'Missing title' });
    else if (p.title.length > 70)
      record({
        severity: 'warn',
        category: 'metadata',
        slug,
        message: `Title is ${p.title.length} chars (>70); social previews may clip`,
      });

    if (!p.metaTitle)
      record({ severity: 'error', category: 'metadata', slug, message: 'Missing metaTitle' });
    else if (p.metaTitle.length > 60)
      record({
        severity: 'warn',
        category: 'metadata',
        slug,
        message: `metaTitle is ${p.metaTitle.length} chars (>60); Google may rewrite`,
      });

    if (!p.description) {
      record({ severity: 'error', category: 'metadata', slug, message: 'Missing description' });
    } else if (p.description.length < 50 || p.description.length > 160) {
      record({
        severity: 'warn',
        category: 'metadata',
        slug,
        message: `description is ${p.description.length} chars (target 50-160)`,
      });
    }

    if (!p.excerpt)
      record({ severity: 'warn', category: 'metadata', slug, message: 'Missing excerpt' });

    if (!p.publishedAt || Number.isNaN(Date.parse(p.publishedAt)))
      record({
        severity: 'error',
        category: 'metadata',
        slug,
        message: `Invalid publishedAt "${p.publishedAt}" (use ISO date)`,
      });

    if (!p.readingMinutes || p.readingMinutes < 1)
      record({ severity: 'warn', category: 'metadata', slug, message: 'readingMinutes missing or 0' });

    if (p.tags.length === 0)
      record({ severity: 'warn', category: 'metadata', slug, message: 'No tags defined' });

    if (p.faqCount < 2)
      record({
        severity: 'warn',
        category: 'metadata',
        slug,
        message: `Only ${p.faqCount} FAQ items — add at least 2 for FAQPage JSON-LD`,
      });
  }
}

/* ────────────────────────────────────────────────────────────── */
/* 3. Sitemap check                                               */
/* ────────────────────────────────────────────────────────────── */

function validateSitemap(posts: PostMeta[]) {
  const sitemap = readFileSync(resolve('public/sitemap.xml'), 'utf8');
  const locs = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
  const blogLocs = locs.filter((u) => /\/blog\/[^/]+\/?$/.test(u));
  const blogSlugs = new Set(
    blogLocs.map((u) => u.replace(/\/$/, '').split('/blog/')[1])
  );

  for (const p of posts) {
    if (!blogSlugs.has(p.slug)) {
      record({
        severity: 'error',
        category: 'sitemap',
        slug: p.slug,
        message: `Missing /blog/${p.slug} from public/sitemap.xml`,
      });
    }
  }

  const registrySlugs = new Set(posts.map((p) => p.slug));
  for (const s of blogSlugs) {
    if (!registrySlugs.has(s)) {
      record({
        severity: 'warn',
        category: 'sitemap',
        slug: s,
        message: `Sitemap references /blog/${s} but no matching post in registry (stale entry)`,
      });
    }
  }
}

/* ────────────────────────────────────────────────────────────── */
/* 4. Liveness check (fetches each post URL)                      */
/* ────────────────────────────────────────────────────────────── */

async function validateLiveness(posts: PostMeta[]) {
  for (const p of posts) {
    const url = `${BASE_URL}/blog/${p.slug}`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'SoloSuccessAcademy-SEOValidator/1.0' },
      });
      if (res.status !== 200) {
        record({
          severity: 'error',
          category: 'liveness',
          slug: p.slug,
          message: `${url} returned HTTP ${res.status}`,
        });
        continue;
      }
      const html = await res.text();

      // Title check — react-helmet-async hydrates, but the static
      // index.html title is also acceptable as long as the page loads.
      // We look for the expected <title> OR a meta og:title with the
      // post's metaTitle to give the dynamic head time to render in CI.
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '';
      const ogTitleMatch =
        html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1] ?? '';
      const candidates = [titleMatch, ogTitleMatch].filter(Boolean);
      const expectedTitle = (p.metaTitle || p.title).slice(0, 25);
      const titleOk = candidates.some((t) => t.includes(expectedTitle));
      if (!titleOk) {
        record({
          severity: 'warn',
          category: 'liveness',
          slug: p.slug,
          message: `Could not find expected title fragment "${expectedTitle}" in <title> or og:title (got <title>: "${titleMatch.slice(0, 60)}")`,
        });
      }

      const canonical =
        html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1] ?? '';
      if (canonical && !canonical.includes(`/blog/${p.slug}`)) {
        record({
          severity: 'warn',
          category: 'liveness',
          slug: p.slug,
          message: `Canonical "${canonical}" does not point at this post's URL`,
        });
      }
    } catch (err: any) {
      record({
        severity: 'error',
        category: 'liveness',
        slug: p.slug,
        message: `Fetch failed for ${url}: ${err?.message ?? err}`,
      });
    }
  }
}

/* ────────────────────────────────────────────────────────────── */
/* 5. Google indexing check via Search Console                    */
/*    Uses searchAnalytics over the last 28 days — if a URL has   */
/*    zero impressions, it almost certainly is not indexed (or    */
/*    not ranking for anything yet).                              */
/* ────────────────────────────────────────────────────────────── */

async function validateIndexing(posts: PostMeta[]) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GSC_KEY = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;

  if (!LOVABLE_API_KEY || !GSC_KEY) {
    record({
      severity: 'info',
      category: 'indexing',
      message:
        'Skipped — set LOVABLE_API_KEY and GOOGLE_SEARCH_CONSOLE_API_KEY to enable Search Console checks.',
    });
    return;
  }

  const siteUrl = `${BASE_URL}/`;
  const today = new Date();
  const twentyEightDaysAgo = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const endpoint = `https://connector-gateway.lovable.dev/google_search_console/webmasters/v3/sites/${encodeURIComponent(
    siteUrl
  )}/searchAnalytics/query`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': GSC_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: fmt(twentyEightDaysAgo),
        endDate: fmt(today),
        dimensions: ['page'],
        rowLimit: 1000,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      record({
        severity: 'warn',
        category: 'indexing',
        message: `Search Console call failed (HTTP ${res.status}): ${text.slice(0, 200)}`,
      });
      return;
    }
    const data = (await res.json()) as { rows?: { keys?: string[]; impressions?: number }[] };
    const pagesWithImpressions = new Set(
      (data.rows ?? []).map((r) => (r.keys?.[0] ?? '').replace(/\/$/, ''))
    );

    for (const p of posts) {
      const url = `${BASE_URL}/blog/${p.slug}`.replace(/\/$/, '');
      if (!pagesWithImpressions.has(url)) {
        record({
          severity: 'warn',
          category: 'indexing',
          slug: p.slug,
          message:
            'No impressions in the last 28 days — likely not indexed yet. Submit the URL in Search Console.',
        });
      }
    }
  } catch (err: any) {
    record({
      severity: 'warn',
      category: 'indexing',
      message: `Search Console request error: ${err?.message ?? err}`,
    });
  }
}

/* ────────────────────────────────────────────────────────────── */
/* Output                                                         */
/* ────────────────────────────────────────────────────────────── */

function printReport(posts: PostMeta[]) {
  console.log('');
  console.log(c.bold(c.cyan('━━━ Blog SEO Validation ━━━')));
  console.log(c.dim(`Base URL : ${BASE_URL}`));
  console.log(c.dim(`Posts    : ${posts.length}`));
  console.log('');

  const groups: Record<string, Finding[]> = {};
  for (const f of findings) {
    (groups[f.category] ??= []).push(f);
  }

  for (const cat of ['metadata', 'sitemap', 'liveness', 'indexing']) {
    const list = groups[cat] ?? [];
    if (list.length === 0) {
      console.log(`${c.green('✓')} ${c.bold(cat.padEnd(10))} all checks passed`);
      continue;
    }
    console.log(`${c.yellow('!')} ${c.bold(cat.padEnd(10))} ${list.length} finding(s)`);
    for (const f of list) {
      const icon =
        f.severity === 'error' ? c.red('  ✗') : f.severity === 'warn' ? c.yellow('  ⚠') : c.dim('  ·');
      const slug = f.slug ? c.dim(` [${f.slug}]`) : '';
      console.log(`${icon}${slug} ${f.message}`);
    }
  }

  const errors = findings.filter((f) => f.severity === 'error').length;
  const warns = findings.filter((f) => f.severity === 'warn').length;
  console.log('');
  console.log(c.bold(`Summary: ${errors} error(s), ${warns} warning(s)`));

  return errors === 0 ? 0 : 1;
}

/* ────────────────────────────────────────────────────────────── */
/* Main                                                           */
/* ────────────────────────────────────────────────────────────── */

async function main() {
  const posts = parsePosts();
  if (posts.length === 0) {
    console.error(c.red('No posts found in registry — aborting.'));
    process.exit(1);
  }

  validateMetadata(posts);
  validateSitemap(posts);
  if (!SKIP_LIVE) await validateLiveness(posts);
  if (!SKIP_INDEXING) await validateIndexing(posts);

  process.exit(printReport(posts));
}

main().catch((err) => {
  console.error(c.red('Validator crashed:'), err);
  process.exit(2);
});