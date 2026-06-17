/**
 * @file BlogPost.tsx — Individual blog post page
 *
 * Resolves the post by `:slug` from the registry. Renders metadata,
 * Article + FAQPage JSON-LD, and the post body.
 */
import { Link, useParams, Navigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { PageMeta } from '@/components/layout/PageMeta';
import { getPostBySlug } from '@/content/blog/posts';
import { getSiteUrl, getOgImageUrl, SITE_NAME } from '@/lib/siteMeta';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

  // Unknown slug → 404 route
  if (!post) return <Navigate to="/blog" replace />;

  const url = `${getSiteUrl()}/blog/${post.slug}`;

  // Article JSON-LD for rich results
  const articleLd = {
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: getOgImageUrl(),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: { '@type': 'Organization', name: post.author.name, url: getSiteUrl() },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: getOgImageUrl() },
    },
    mainEntityOfPage: url,
  };

  // FAQPage JSON-LD (only if the post has FAQs)
  const faqLd = post.faq?.length
    ? {
        '@type': 'FAQPage',
        mainEntity: post.faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }
    : null;

  const Body = post.body;

  return (
    <>
      <PageMeta
        fullTitle={`${post.metaTitle} | ${SITE_NAME}`}
        description={post.description}
        path={`/blog/${post.slug}`}
        jsonLd={faqLd ? [articleLd, faqLd] : articleLd}
      />

      <div className="container py-12 md:py-20 max-w-3xl">
        {/* ── Back link ── */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-mono mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          All posts
        </Link>

        {/* ── Post header ── */}
        <header className="space-y-4 mb-10 pb-8 border-b border-primary/20">
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
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

          <h1 className="text-3xl md:text-5xl font-display font-bold leading-tight">
            {post.title}
          </h1>

          <p className="text-muted-foreground font-mono text-sm">
            By{' '}
            {post.author.url ? (
              <Link to={post.author.url} className="text-primary hover:underline">
                {post.author.name}
              </Link>
            ) : (
              post.author.name
            )}
          </p>
        </header>

        {/* ── Post body ── */}
        <Body />
      </div>
    </>
  );
}