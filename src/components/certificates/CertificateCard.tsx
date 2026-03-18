/**
 * @file CertificateCard.tsx — Certificate Display Card
 *
 * PURPOSE: Renders a single certificate as a card with themed header preview,
 * course title, student name, verification code, and action buttons
 * (Download PDF, Share link, View verification page).
 *
 * THEMING: Each certificate gets a unique color theme based on the course title
 * via getThemeByCourseTitle() from certificateThemes.ts.
 *
 * PDF GENERATION: Download triggers downloadCertificate() from certificateGenerator.ts
 * which uses jsPDF to create a styled PDF entirely client-side.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Certificate } from '@/hooks/useCertificates';
import { downloadCertificate } from '@/lib/certificateGenerator';
import { getThemeByCourseTitle } from '@/lib/certificateThemes';
import { getLinkedInCertUrl } from '@/lib/utils';
import { format } from 'date-fns';
import { Download, Share2, ExternalLink, Award, Linkedin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CertificateCardProps {
  certificate: Certificate;
  courseOrderNumber?: number;
}

export function CertificateCard({ certificate, courseOrderNumber = 1 }: CertificateCardProps) {
  const { toast } = useToast();
  const theme = getThemeByCourseTitle(certificate.course_title);

  const handleDownload = () => {
    downloadCertificate({
      studentName: certificate.student_name,
      courseTitle: certificate.course_title,
      courseOrderNumber,
      verificationCode: certificate.verification_code,
      issuedAt: certificate.issued_at,
    });
    
    toast({
      title: 'Certificate Downloaded',
      description: 'Your certificate PDF has been downloaded.',
    });
  };

  const handleShare = async () => {
    const verifyUrl = `${window.location.origin}/verify/${certificate.verification_code}`;
    
    try {
      await navigator.clipboard.writeText(verifyUrl);
      toast({
        title: 'Link Copied!',
        description: 'Verification link copied to clipboard.',
      });
    } catch {
      toast({
        title: 'Share Link',
        description: verifyUrl,
      });
    }
  };

  return (
    <Card className="glass-card border-primary/30 overflow-hidden group hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] transition-all duration-300">
      {/* Certificate Preview Header */}
      <div 
        className="h-32 relative flex items-center justify-center"
        style={{ 
          background: `linear-gradient(135deg, ${theme.backgroundColor} 0%, ${theme.primaryColor}20 100%)`,
          borderBottom: `2px solid ${theme.primaryColor}40`
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-2 right-2 bottom-2 border-2 rounded" style={{ borderColor: theme.primaryColor }} />
        </div>
        <div className="text-center relative z-10">
          <Award 
            className="h-10 w-10 mx-auto mb-1" 
            style={{ color: theme.primaryColor }}
          />
          <p className="text-xs font-mono opacity-70" style={{ color: theme.textColor }}>
            CERTIFICATE OF COMPLETION
          </p>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Course Title */}
        <h3 className="font-display font-semibold text-lg mb-1 truncate">
          {certificate.course_title}
        </h3>
        
        {/* Student Name */}
        <p className="text-sm text-muted-foreground mb-3">
          Awarded to <span className="text-foreground font-medium">{certificate.student_name}</span>
        </p>

        {/* Meta Info */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Badge variant="outline" className="text-xs border-primary/30">
            {format(new Date(certificate.issued_at), 'MMM d, yyyy')}
          </Badge>
          <Badge variant="outline" className="text-xs font-mono border-secondary/30">
            {certificate.verification_code}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="neon" 
            size="sm" 
            className="flex-1 gap-2"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="border-primary/30 hover:bg-primary/10"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          {/* LinkedIn Add to Profile */}
          <Button
            variant="outline"
            size="sm"
            className="border-primary/30 hover:bg-primary/10"
            asChild
          >
            <a
              href={getLinkedInCertUrl({
                name: `${certificate.course_title} — SoloSuccess Academy`,
                organizationName: 'SoloSuccess Academy',
                issueDate: certificate.issued_at,
                certUrl: `${window.location.origin}/verify/${certificate.verification_code}`,
              })}
              target="_blank"
              rel="noopener noreferrer"
              title="Add to LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="border-primary/30 hover:bg-primary/10"
            asChild
          >
            <a href={`/verify/${certificate.verification_code}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
