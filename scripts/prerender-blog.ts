/**
 * @file prerender-blog.ts — Post-build prerender for /blog routes.
 *
 * WHY: This app is a Vite SPA, so the built dist/index.html ships one
 * static <title>/<meta description>/<og:*> block for every route. Social
 * and search crawlers that don't run JS (LinkedIn, Slack, Facebook,
 * older search bots) therefore see the sitewide fallback on every blog
 * post URL. To give them per-post metadata without introducing SSR, we
 * generate a static HTML file per blog route at dist/blog/<slug>/index.html
 * with the head tags rewritten to that post's metadata. Vercel/Vite's
 * static-first serving means these files are returned before the SPA
 * fallback kicks in, and the client hydrates as normal from there.
 *
 * Runs from `postbuild`.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

const BASE_URL = 'https://solosuccessacademy.app';
const DIST_DIR = resolve('dist');
const INDEX_HTML = resolve(DIST_DIR, 'index.html');

/* ────────────────────────────────────────────────────────────── */
/* Parse blog post metadata directly from posts.tsx               */
/* (same tolerant regex approach as scripts/validate-blog-seo.ts) */
/* ────────────────────────────────────────────────────────────── */

interface PostMeta {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  tags: string[];
  author: string;
  faq: { q: string; a: string }[];
}

function parsePosts(): PostMeta[] {
  const src = readFileSync(resolve('src/content/blog/posts.tsx'), 'utf8');
  const arrayMatch = src.match(
    /export const BLOG_POSTS:\s*BlogPost\[\]\s*=\s*\[([\s\S]*?)\n\];/,
  );
  if (!arrayMatch) throw new Error('Could not locate BLOG_POSTS array in posts.tsx');

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
      const m = raw.match(new RegExp(`\\b${key}\\s*:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`));
      return m ? m[2].replace(/\\'/g, "'").replace(/\\"/g, '"') : undefined;
    };
    const tagsMatch = raw.match(/\btags\s*:\s*\[([^\]]*)\]/);
    const tags = tagsMatch
      ? Array.from(tagsMatch[1].matchAll(/['"`]([^'"`]+)['"`]/g)).map((m) => m[1])
      : [];
    // Extract FAQ items — capture q/a string literals in order.
    const faqBlock = raw.match(/\bfaq\s*:\s*\[([\s\S]*?)\n\s*\]/);
    const faq: { q: string; a: string }[] = [];
    if (faqBlock) {
      const items = faqBlock[1].matchAll(
        /\bq\s*:\s*(['"`])((?:\\.|(?!\1).)*)\1[\s\S]*?\ba\s*:\s*(['"`])((?:\\.|(?!\3).)*)\3/g,
      );
      for (const m of items) {
        faq.push({
          q: m[2].replace(/\\'/g, "'").replace(/\\"/g, '"'),
          a: m[4].replace(/\\'/g, "'").replace(/\\"/g, '"'),
        });
      }
    }
    const authorName = raw.match(/\bauthor\s*:\s*\{[^}]*\bname\s*:\s*['"`]([^'"`]+)['"`]/)?.[1] ?? 'SoloSuccess Academy';

    return {
      slug: pick('slug') ?? '',
      title: pick('title') ?? '',
      metaTitle: pick('metaTitle') ?? '',
      description: pick('description') ?? '',
      publishedAt: pick('publishedAt') ?? '',
      updatedAt: pick('updatedAt'),
      readingMinutes: Number(raw.match(/\breadingMinutes\s*:\s*(\d+)/)?.[1] ?? '0'),
      tags,
      author: authorName,
      faq,
    };
  });
}

/* ────────────────────────────────────────────────────────────── */
/* HTML head rewrite                                              */
/* ────────────────────────────────────────────────────────────── */

const escapeAttr = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeText = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface HeadOverride {
  title: string;
  description: string;
  canonical: string;
  ogType: 'website' | 'article';
  jsonLd: Record<string, unknown>[];
}

function rewriteHead(html: string, o: HeadOverride): string {
  let out = html;

  // <title>
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeText(o.title)}</title>`);

  // <meta name="description">
  out = out.replace(
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escapeAttr(o.description)}">`,
  );

  // og:type — swap website → article on post pages
  out = out.replace(
    /<meta\s+property=["']og:type["'][^>]*>/i,
    `<meta property="og:type" content="${o.ogType}">`,
  );

  // og:title / twitter:title
  out = out.replace(
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${escapeAttr(o.title)}">`,
  );
  out = out.replace(
    /<meta\s+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${escapeAttr(o.title)}">`,
  );

  // og:description / twitter:description
  out = out.replace(
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${escapeAttr(o.description)}">`,
  );
  out = out.replace(
    /<meta\s+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${escapeAttr(o.description)}">`,
  );

  // Inject canonical + og:url immediately before </head>.
  const injected = [
    `<link rel="canonical" href="${escapeAttr(o.canonical)}">`,
    `<meta property="og:url" content="${escapeAttr(o.canonical)}">`,
    ...o.jsonLd.map(
      (obj) =>
        `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`,
    ),
  ].join('\n  ');
  out = out.replace('</head>', `  ${injected}\n</head>`);

  return out;
}

/* ────────────────────────────────────────────────────────────── */
/* Main                                                           */
/* ────────────────────────────────────────────────────────────── */

function writePage(routePath: string, html: string) {
  // routePath e.g. "/blog" or "/blog/my-slug" → dist/blog/index.html
  //                                             dist/blog/my-slug/index.html
  const outPath = resolve(DIST_DIR, `.${routePath}/index.html`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
}

function main() {
  if (!existsSync(INDEX_HTML)) {
    console.warn(`[prerender-blog] Skipping — ${INDEX_HTML} not found (build first).`);
    return;
  }
  const template = readFileSync(INDEX_HTML, 'utf8');
  const posts = parsePosts();

  // /blog index
  const indexTitle = 'Blog — SoloSuccess Academy';
  const indexDesc =
    'Essays and playbooks for solo founders — building, marketing, and shipping a one-person business.';
  const indexHtml = rewriteHead(template, {
    title: indexTitle,
    description: indexDesc,
    canonical: `${BASE_URL}/blog`,
    ogType: 'website',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'SoloSuccess Academy Blog',
        url: `${BASE_URL}/blog`,
        description: indexDesc,
      },
    ],
  });
  writePage('/blog', indexHtml);

  // /blog/<slug>
  for (const p of posts) {
    if (!p.slug) continue;
    const canonical = `${BASE_URL}/blog/${p.slug}`;
    const title = p.metaTitle || p.title;
    const jsonLd: Record<string, unknown>[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: p.title,
        description: p.description,
        datePublished: p.publishedAt,
        ...(p.updatedAt ? { dateModified: p.updatedAt } : {}),
        author: { '@type': 'Person', name: p.author },
        publisher: {
          '@type': 'Organization',
          name: 'SoloSuccess Academy',
          logo: {
            '@type': 'ImageObject',
            url: `${BASE_URL}/og-image.png`,
          },
        },
        mainEntityOfPage: canonical,
        keywords: p.tags.join(', '),
      },
    ];
    if (p.faq.length >= 2) {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: p.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      });
    }

    const html = rewriteHead(template, {
      title,
      description: p.description,
      canonical,
      ogType: 'article',
      jsonLd,
    });
    writePage(`/blog/${p.slug}`, html);
  }

  console.log(`[prerender-blog] Wrote /blog + ${posts.length} post page(s) with per-route metadata.`);
}

main();