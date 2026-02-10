import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { downloadCertificate, downloadCertificateShareImage } from '@/lib/certificateGenerator';
import { getThemeByCourseTitle } from '@/lib/certificateThemes';
import { Download, Share2, Award, PartyPopper, ExternalLink, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  courseTitle: string;
  courseOrderNumber: number;
  verificationCode: string;
  issuedAt: string;
}

export function CertificateModal({
  isOpen,
  onClose,
  studentName,
  courseTitle,
  courseOrderNumber,
  verificationCode,
  issuedAt,
}: CertificateModalProps) {
  const { toast } = useToast();
  const theme = getThemeByCourseTitle(courseTitle);

  const handleDownload = () => {
    downloadCertificate({
      studentName,
      courseTitle,
      courseOrderNumber,
      verificationCode,
      issuedAt,
    });
    
    toast({
      title: 'Certificate Downloaded!',
      description: 'Your certificate PDF has been saved.',
    });
  };

  const handleShare = async () => {
    const verifyUrl = `${window.location.origin}/verify/${verificationCode}`;
    
    try {
      await navigator.clipboard.writeText(verifyUrl);
      toast({
        title: 'Link Copied!',
        description: 'Share this link to verify your certificate.',
      });
    } catch {
      toast({
        title: 'Verification Link',
        description: verifyUrl,
      });
    }
  };

  const handleDownloadImage = () => {
    downloadCertificateShareImage({
      studentName,
      courseTitle,
      courseOrderNumber,
      verificationCode,
      issuedAt,
    });
    toast({
      title: 'Image Downloaded!',
      description: 'Share this image on LinkedIn or Twitter.',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg glass-card border-primary/30">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.5)]">
            <PartyPopper className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-display neon-text">
            Congratulations! 🎉
          </DialogTitle>
          <DialogDescription className="text-base">
            You've completed <span className="text-primary font-medium">{courseTitle}</span> and earned your certificate!
          </DialogDescription>
        </DialogHeader>

        {/* Certificate Preview */}
        <div 
          className="mt-4 p-6 rounded-lg border-2 relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${theme.backgroundColor} 0%, ${theme.primaryColor}10 100%)`,
            borderColor: `${theme.primaryColor}40`
          }}
        >
          {/* Decorative border */}
          <div 
            className="absolute inset-2 border rounded opacity-30"
            style={{ borderColor: theme.primaryColor }}
          />
          
          <div className="text-center relative z-10">
            <Award className="h-12 w-12 mx-auto mb-3" style={{ color: theme.primaryColor }} />
            <p className="text-xs font-mono tracking-widest opacity-60 mb-2" style={{ color: theme.textColor }}>
              CERTIFICATE OF COMPLETION
            </p>
            <h3 className="font-display font-bold text-lg mb-2" style={{ color: theme.textColor }}>
              {courseTitle}
            </h3>
            <p className="text-sm mb-1" style={{ color: theme.textColor }}>
              Awarded to
            </p>
            <p className="font-display font-bold text-xl mb-3" style={{ color: theme.primaryColor }}>
              {studentName}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Badge variant="outline" className="text-xs" style={{ borderColor: `${theme.primaryColor}50` }}>
                {format(new Date(issuedAt), 'MMM d, yyyy')}
              </Badge>
              <Badge variant="outline" className="text-xs font-mono" style={{ borderColor: `${theme.secondaryColor}50` }}>
                {verificationCode}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-6">
          <Button 
            variant="neon" 
            className="flex-1 min-w-[140px] gap-2"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 border-primary/30 hover:bg-primary/10"
            onClick={handleDownloadImage}
          >
            <Image className="h-4 w-4" />
            Share image
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 border-primary/30 hover:bg-primary/10"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            Copy link
          </Button>
        </div>

        <div className="text-center mt-2">
          <a 
            href={`/verify/${verificationCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
          >
            View public verification page
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
