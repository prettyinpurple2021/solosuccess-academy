import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVerifyCertificate } from '@/hooks/useCertificates';
import { getThemeByCourseTitle } from '@/lib/certificateThemes';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { format } from 'date-fns';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Shield, 
  Calendar,
  User,
  BookOpen,
  Zap
} from 'lucide-react';
import { PageMeta } from '@/components/layout/PageMeta';
import { ErrorView } from '@/components/ui/error-view';

export default function VerifyCertificate() {
  const { verificationCode } = useParams<{ verificationCode: string }>();
  const { data: certificate, isLoading, error, refetch } = useVerifyCertificate(verificationCode);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center cyber-bg">
        <div className="cyber-grid" />
        <NeonSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen cyber-bg flex items-center justify-center p-4">
        <div className="cyber-grid" />
        <ErrorView
          message={error.message}
          onRetry={() => refetch()}
          backTo="/"
          backLabel="Go home"
        />
      </div>
    );
  }

  const theme = certificate ? getThemeByCourseTitle(certificate.course_title) : null;

  return (
    <div className="min-h-screen cyber-bg">
      <PageMeta
        fullTitle="Verify Certificate | SoloSuccess Academy"
        description="Verify the authenticity of a SoloSuccess Academy certificate of completion."
        path={verificationCode ? `/verify/${verificationCode}` : undefined}
      />
      <div className="cyber-grid" />
      
      {/* Header */}
      <header className="border-b border-primary/20 bg-black/60 backdrop-blur-xl">
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

      <main className="container py-12 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Verification Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-mono text-muted-foreground tracking-wider">
                CERTIFICATE VERIFICATION
              </span>
            </div>
            <h1 className="text-3xl font-display font-bold neon-text mb-2">
              Verify Certificate
            </h1>
            <p className="text-muted-foreground">
              Verification Code: <span className="font-mono text-primary">{verificationCode}</span>
            </p>
          </div>

          {certificate ? (
            /* Valid Certificate */
            <Card className="glass-card border-success/30 overflow-hidden">
              {/* Success Banner */}
              <div className="bg-success/10 border-b border-success/20 p-4">
                <div className="flex items-center justify-center gap-2 text-success">
                  <CheckCircle2 className="h-5 w-5 drop-shadow-[0_0_8px_hsl(var(--success))]" />
                  <span className="font-display font-semibold">Verified Authentic Certificate</span>
                </div>
              </div>

              {/* Certificate Details */}
              <div 
                className="p-8"
                style={{ 
                  background: `linear-gradient(135deg, ${theme?.backgroundColor || '#FDF5E6'} 0%, ${theme?.primaryColor || '#8B4513'}10 100%)`
                }}
              >
                <div className="text-center mb-8">
                  <Award 
                    className="h-16 w-16 mx-auto mb-4" 
                    style={{ color: theme?.primaryColor || 'hsl(var(--primary))' }}
                  />
                  <p className="text-xs font-mono tracking-widest opacity-60 mb-2" style={{ color: theme?.textColor }}>
                    CERTIFICATE OF COMPLETION
                  </p>
                  <h2 className="font-display font-bold text-2xl mb-6" style={{ color: theme?.textColor }}>
                    {certificate.course_title}
                  </h2>
                  <p className="text-sm mb-2" style={{ color: theme?.textColor }}>
                    This certificate was awarded to
                  </p>
                  <p className="font-display font-bold text-3xl mb-4" style={{ color: theme?.primaryColor }}>
                    {certificate.student_name}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-black/20">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Issue Date</p>
                      <p className="font-medium text-sm">
                        {format(new Date(certificate.issued_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-black/20">
                    <BookOpen className="h-5 w-5 text-secondary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Course</p>
                      <p className="font-medium text-sm truncate">
                        {certificate.course_title.split(' ').slice(0, 2).join(' ')}...
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verification Code */}
                <div className="mt-6 text-center">
                  <Badge 
                    variant="outline" 
                    className="text-sm font-mono px-4 py-1"
                    style={{ borderColor: `${theme?.primaryColor}50` }}
                  >
                    {certificate.verification_code}
                  </Badge>
                </div>
              </div>

              {/* Footer */}
              <CardContent className="bg-black/40 py-4">
                <p className="text-xs text-center text-muted-foreground">
                  This certificate was issued by SoloSuccess Academy and can be independently verified.
                </p>
              </CardContent>
            </Card>
          ) : (
            /* Invalid Certificate */
            <Card className="glass-card border-destructive/30">
              <CardContent className="py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-6">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-3 text-destructive">
                  Certificate Not Found
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  The verification code <span className="font-mono text-foreground">{verificationCode}</span> does not match any certificate in our records.
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                  Please check the code and try again, or contact support if you believe this is an error.
                </p>
                <Button variant="neon" asChild>
                  <Link to="/">Return to Home</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
