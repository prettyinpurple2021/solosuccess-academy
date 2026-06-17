/**
 * @file Blog.tsx — Blog index page
 *
 * Lists all posts from the registry. Public route at `/blog`.
 */
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Zap } from 'lucide-react';
import { PageMeta } from '@/components/layout/PageMeta';
import { BLOG_POSTS } from '@/content/blog/posts';
import { getSiteUrl } from '@/lib/siteMeta';

export default function Blog() {
  const posts = [...BLOG_POSTS].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );

  // Blog JSON-LD (CollectionPage) for SEO
  const jsonLd = {
    '@type': 'CollectionPage',
    name: 'SoloSuccess Academy Blog',
    url: `${getSiteUrl()}/blog`,
    description:
      'Honest writing on solo entrepreneurship, online learning, and building a one-person business.',
  };

  return (
    <>
      <PageMeta
        title="Blog — Honest writing for solo founders"
        description="Honest, opinionated articles on solo entrepreneurship, online learning, and building a one-person business — from the team behind SoloSuccess Academy."
        path="/blog"
        jsonLd={jsonLd}
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* ── Header ── */}
        <header className="text-center space-y-4 mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-mono">
            <Zap className="h-4 w-4" />
            Blog
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">
            Honest writing for <span className="text-gradient">solo founders</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            No affiliate links. No "best of" filler. Just opinionated, hands-on
            takes from the team building SoloSuccess Academy.
          </p>
        </header>

        {/* ── Post list ── */}
        <div className="grid gap-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group relative border border-primary/20 bg-card/40 rounded-lg p-6 md:p-8 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground mb-3">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readingMinutes} min read
                </span>
              </div>

              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                <Link to={`/blog/${post.slug}`} className="after:absolute after:inset-0">
                  {post.title}
                </Link>
              </h2>

              <p className="text-muted-foreground leading-relaxed mb-4">
                {post.excerpt}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded border border-primary/20 text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
                <span className="ml-auto inline-flex items-center gap-1 text-sm text-primary font-mono">
                  Read <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}