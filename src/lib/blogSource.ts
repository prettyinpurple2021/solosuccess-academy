/**
 * blogSource.ts — Unified blog data source.
 *
 * Merges:
 * - Legacy TSX posts in `src/content/blog/posts.tsx` (hand-written articles).
 * - DB posts in `blog_posts` (auto-generated weekly + admin posts).
 *
 * Used by the public Blog index and BlogPost pages.
 */
import { supabase } from '@/integrations/supabase/client';
import { BLOG_POSTS as LEGACY_POSTS, type BlogPost as LegacyBlogPost } from '@/content/blog/posts';

export interface UnifiedPost {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  author: { name: string; url?: string };
  tags: string[];
  faq?: { q: string; a: string }[];
  /** Render path: legacy posts render a React body, DB posts render sanitized HTML. */
  source: 'legacy' | 'db';
  body?: LegacyBlogPost['body'];
  bodyHtml?: string;
}

function legacyToUnified(p: LegacyBlogPost): UnifiedPost {
  return {
    slug: p.slug,
    title: p.title,
    metaTitle: p.metaTitle,
    description: p.description,
    excerpt: p.excerpt,
    publishedAt: p.publishedAt,
    updatedAt: p.updatedAt,
    readingMinutes: p.readingMinutes,
    author: p.author,
    tags: p.tags,
    faq: p.faq,
    source: 'legacy',
    body: p.body,
  };
}

/** Fetch every published post (legacy + DB), newest first. */
export async function fetchAllPosts(): Promise<UnifiedPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug,title,meta_title,description,excerpt,tags,faq,reading_minutes,author_name,published_at,updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) console.warn('blog_posts fetch failed', error);

  const dbPosts: UnifiedPost[] = (data ?? []).map((p) => ({
    slug: p.slug,
    title: p.title,
    metaTitle: p.meta_title,
    description: p.description,
    excerpt: p.excerpt,
    publishedAt: p.published_at,
    updatedAt: p.updated_at ?? undefined,
    readingMinutes: p.reading_minutes,
    author: { name: p.author_name },
    tags: p.tags ?? [],
    faq: (p.faq as { q: string; a: string }[] | null) ?? undefined,
    source: 'db',
  }));

  const legacyUnified = LEGACY_POSTS.map(legacyToUnified);

  // De-duplicate by slug (DB wins if collision)
  const seen = new Set<string>();
  const merged: UnifiedPost[] = [];
  for (const p of [...dbPosts, ...legacyUnified]) {
    if (seen.has(p.slug)) continue;
    seen.add(p.slug);
    merged.push(p);
  }
  return merged.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** Fetch a single post by slug (DB first, then legacy). */
export async function fetchPostBySlug(slug: string): Promise<UnifiedPost | null> {
  const { data } = await supabase
    .from('blog_posts')
    .select('slug,title,meta_title,description,excerpt,body_html,tags,faq,reading_minutes,author_name,published_at,updated_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (data) {
    return {
      slug: data.slug,
      title: data.title,
      metaTitle: data.meta_title,
      description: data.description,
      excerpt: data.excerpt,
      publishedAt: data.published_at,
      updatedAt: data.updated_at ?? undefined,
      readingMinutes: data.reading_minutes,
      author: { name: data.author_name },
      tags: data.tags ?? [],
      faq: (data.faq as { q: string; a: string }[] | null) ?? undefined,
      source: 'db',
      bodyHtml: data.body_html,
    };
  }

  const legacy = LEGACY_POSTS.find((p) => p.slug === slug);
  return legacy ? legacyToUnified(legacy) : null;
}