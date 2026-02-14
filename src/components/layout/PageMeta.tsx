import { Helmet } from "react-helmet-async";
import {
  SITE_NAME,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  TWITTER_HANDLE,
  getSiteUrl,
  getOgImageUrl,
} from "@/lib/siteMeta";

export interface PageMetaProps {
  /** Page title (e.g. "Sign In" or "Course: The Solo Singularity"). Appended after site name when fullTitle not set. */
  title?: string;
  /** Full title override (e.g. "Verify Certificate | SoloSuccess Academy"). If set, used as-is. */
  fullTitle?: string;
  /** Meta description. Falls back to default site description if not set. */
  description?: string;
  /** Path for canonical URL (e.g. "/courses/123"). Optional. */
  path?: string;
  /** Override og:image path (e.g. "/cert-og.png"). Defaults to /og-image.png. */
  ogImagePath?: string;
  /** Set to true for pages that should not be indexed (e.g. auth, dashboard). */
  noIndex?: boolean;
}

/**
 * Sets document title and meta tags for SEO and social sharing.
 * Use once per page (typically at the top of the page component).
 */
export function PageMeta({
  title,
  fullTitle,
  description = DEFAULT_DESCRIPTION,
  path,
  ogImagePath,
  noIndex = false,
}: PageMetaProps) {
  const resolvedTitle = fullTitle ?? (title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE);
  const canonicalUrl = path ? `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}` : undefined;
  const ogImage = getOgImageUrl(ogImagePath);

  return (
    <Helmet>
      <title>{resolvedTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
