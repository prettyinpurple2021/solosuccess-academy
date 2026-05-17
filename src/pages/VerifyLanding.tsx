/**
 * @file VerifyLanding.tsx — Public certificate lookup page at /verify
 *
 * Lets anyone (recruiters, partners, the public) enter a SoloSuccess Academy
 * verification code and jump to /verify/:code. Links to the Certificate
 * Verification Policy PDF for download.
 */
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Search, FileText, Download, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PageMeta } from '@/components/layout/PageMeta';
import { toast } from '@/hooks/use-toast';
import { getLegalDocBySlug, getLegalDocUrl } from '@/lib/legalDocuments';

export default function VerifyLanding() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  // The Certificate Verification Policy lives in the Legal Center.
  const policy = getLegalDocBySlug('certificate-verification');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      toast({
        title: 'Enter a verification code',
        description: 'Paste the code from the certificate to look it up.',
        variant: 'destructive',
      });
      return;
    }
    // Encode in case a code ever contains URL-unsafe chars.
    navigate(`/verify/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen cyber-bg">
      <PageMeta
        fullTitle="Verify a Certificate | SoloSuccess Academy"
        description="Confirm the authenticity of a SoloSuccess Academy certificate of completion by entering its verification code."
        path="/verify"
      />
      <div className="cyber-grid" />

      {/* Header */}
      <header className="border-b border-primary/20 header-glass">
        <div className="container py-4">
          <Link to="/" className="flex items-center gap-3 group w-fit">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-accent to-secondary text-primary-foreground font-bold overflow-hidden shadow-[0_0_20px_hsl(270_80%_50%/0.5)]">
              <Zap className="h-5 w-5" />
            </div>
            <span className="font-display font-bold text-lg tracking-wider">
              <span className="text-gradient">SOLO</span>
              <span className="text-foreground">SUCCESS</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="container py-16 relative z-10">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent mb-4 shadow-[0_0_30px_hsl(270_80%_50%/0.4)]">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-wider text-gradient mb-3">
              VERIFY A CERTIFICATE
            </h1>
            <p className="text-muted-foreground font-mono text-sm max-w-md mx-auto">
              Every SoloSuccess Academy certificate carries a unique verification code.
              Enter it below to confirm authenticity, recipient, course, and issue date.
            </p>
          </div>

          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <label htmlFor="verification-code" className="text-xs font-mono tracking-wider text-muted-foreground uppercase">
                  Verification Code
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="verification-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. SSA-XXXXX-XXXXX"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    className="font-mono tracking-wider"
                  />
                  <Button type="submit" variant="neon" className="shrink-0">
                    <Search className="h-4 w-4 mr-2" />
                    Verify
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  The code is printed on the certificate PDF and included in every shareable
                  certificate link.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Policy download */}
          {policy && (
            <div className="mt-8 rounded-lg border border-primary/20 bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-display font-semibold text-sm">{policy.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">{policy.description}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/legal/${policy.slug}`}>View</Link>
                </Button>
                <Button asChild size="sm">
                  <a href={getLegalDocUrl(policy)} download>
                    <Download className="h-3.5 w-3.5 mr-1" />
                    PDF
                  </a>
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground font-mono text-center mt-8">
            Suspect a forged certificate? Email{' '}
            <a href="mailto:Support@solosuccessacademy.cloud" className="text-primary hover:underline">
              Support@solosuccessacademy.cloud
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}