/**
 * @file CTASection.tsx — Final call-to-action with UI frame
 * 
 * Bottom-of-page conversion section encouraging sign-up,
 * wrapped in a neon UI frame with key benefit reminders.
 * Mobile-optimized spacing and text sizing.
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Rocket, Trophy, CheckCircle2 } from 'lucide-react';
import { UIFrame } from '@/components/landing/UIFrame';

export function CTASection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 sm:px-6">
        <UIFrame scanline color="primary" className="max-w-4xl mx-auto">
          <div className="data-card overflow-hidden relative">
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
            <div className="absolute inset-0 grid-pattern opacity-30" />

            <div className="p-8 sm:p-12 md:p-16 text-center relative">
              <div className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-6 sm:mb-8 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_40px_hsl(270_80%_50%/0.5)] animate-glow">
                <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4 sm:mb-6 animate-neon-glow">
                <span className="text-foreground">READY TO</span>
                <br />
                <span className="text-gradient">TRANSFORM?</span>
              </h2>

              <p className="text-muted-foreground max-w-xl mx-auto mb-8 sm:mb-10 text-base sm:text-lg leading-relaxed">
                Start your journey today. Complete all 10 courses and graduate with a
                professional portfolio and investor-ready pitch.
              </p>

              <Button size="lg" variant="neon" asChild className="text-base sm:text-lg px-8 sm:px-12 h-12 sm:h-14 btn-cyber">
                <Link to="/auth?mode=signup">
                  <Rocket className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Launch Your Journey
                </Link>
              </Button>

              {/* Benefits — stacked on small mobile, row on larger */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 md:gap-8 mt-8 sm:mt-12 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                  <span className="font-mono">Lifetime access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                  <span className="font-mono">AI-powered feedback</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                  <span className="font-mono">Certificate on completion</span>
                </div>
              </div>
            </div>
          </div>
        </UIFrame>
      </div>
    </section>
  );
}
