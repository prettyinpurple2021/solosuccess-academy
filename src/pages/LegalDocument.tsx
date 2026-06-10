/**
 * @file LegalDocument.tsx — Single-document viewer at /legal/:slug
 * Embeds the PDF in an <iframe> with a clear download fallback.
 */
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { PageMeta } from '@/components/layout/PageMeta';
import { Button } from '@/components/ui/button';
import { getLegalDocBySlug, getLegalDocUrl } from '@/lib/legalDocuments';

export default function LegalDocument() {
  const { slug } = useParams<{ slug: string }>();
  const doc = slug ? getLegalDocBySlug(slug) : undefined;

  if (!doc) return <Navigate to="/legal" replace />;

  const url = getLegalDocUrl(doc);

  return (
    <>
      <PageMeta
        title={`${doc.title} | SoloSuccess Academy`}
        description={doc.description}
        path={`/legal/${slug}`}
      />
      <div className="container max-w-5xl py-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link to="/legal">
              <ArrowLeft className="h-4 w-4 mr-1" />
              All legal documents
            </Link>
          </Button>
          <Button asChild size="sm">
            <a href={url} download>
              <Download className="h-4 w-4 mr-1" />
              Download PDF
            </a>
          </Button>
        </div>

        <header className="mb-6">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-wider text-gradient">
            {doc.title.toUpperCase()}
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-2">
            Version {doc.version} · Effective {new Date(doc.effectiveDate).toLocaleDateString()} · SoloSuccess Solutions
          </p>
        </header>

        <div className="rounded-lg border border-primary/20 overflow-hidden bg-muted/30">
          <iframe
            src={url}
            title={doc.title}
            className="w-full h-[80vh]"
          />
        </div>

        <p className="text-xs text-muted-foreground font-mono text-center mt-4">
          Can't see the document?{' '}
          <a href={url} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            Open it in a new tab
          </a>
          .
        </p>
      </div>
    </>
  );
}