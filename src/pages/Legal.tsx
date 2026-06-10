/**
 * @file Legal.tsx — Legal document hub at /legal
 *
 * Lists every published legal document with version + effective date,
 * and links to /legal/:slug for an in-app PDF viewer.
 */
import { Link } from 'react-router-dom';
import { FileText, Download, ExternalLink, Scale } from 'lucide-react';
import { PageMeta } from '@/components/layout/PageMeta';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LEGAL_DOCUMENTS, getLegalDocUrl } from '@/lib/legalDocuments';

export default function Legal() {
  return (
    <>
      <PageMeta
        title="Legal Center | SoloSuccess Academy"
        description="All SoloSuccess Academy legal documents in one place: terms, privacy, refund, DMCA, and more."
        path="/legal"
      />
      <div className="container max-w-5xl py-16">
        <header className="mb-12 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent mb-4 shadow-[0_0_30px_hsl(270_80%_50%/0.4)]">
            <Scale className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-wider text-gradient mb-3">
            LEGAL CENTER
          </h1>
          <p className="text-muted-foreground font-mono max-w-2xl mx-auto">
            Every policy that governs your use of SoloSuccess Academy.
            Each document is versioned — superseded versions remain on file for audit purposes.
          </p>
          <p className="text-xs text-muted-foreground font-mono mt-4">
            Operated by <strong>SoloSuccess Solutions</strong> · 9169 W State St #1343, Garden City, ID 83714 ·
            Governed by the laws of the State of Georgia, USA.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {LEGAL_DOCUMENTS.map((doc) => (
            <Card key={doc.slug} className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-1 shrink-0" />
                    <div>
                      <CardTitle className="font-display tracking-wide text-lg">{doc.title}</CardTitle>
                      <CardDescription className="font-mono text-xs mt-1">{doc.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-mono text-muted-foreground">
                    v{doc.version} · Effective {new Date(doc.effectiveDate).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/legal/${doc.slug}`}>
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <a href={getLegalDocUrl(doc)} download>
                        <Download className="h-3.5 w-3.5 mr-1" />
                        PDF
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground font-mono text-center mt-10">
          Questions about any policy? Email{' '}
          <a href="mailto:Support@solosuccessacademy.cloud" className="text-primary hover:underline">
            Support@solosuccessacademy.cloud
          </a>
        </p>
      </div>
    </>
  );
}