/**
 * @file CTASection.tsx — Final call-to-action with UI frame
 * 
 * Bottom-of-page conversion section encouraging sign-up,
 * wrapped in a neon UI frame with key benefit reminders.
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Rocket, Trophy, CheckCircle2 } from 'lucide-react';
import { UIFrame } from '@/components/landing/UIFrame';

export function CTASection() {
  return (
    <section className="py-24">
      <div className="container">
        <UIFrame scanline color="primary" className="max-w-4xl mx-auto">
          <div className="data-card overflow-hidden relative">
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
            <div className="absolute inset-0 grid-pattern opacity-30" />

            <div className="p-12 md:p-16 text-center relative">
              <div className="h-20 w-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_40px_hsl(270_80%_50%/0.5)] animate-glow">
                <Trophy className="h-10 w-10 text-primary-foreground" />
              </div>

              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 animate-neon-glow">
                <span className="text-foreground">READY TO</span>
                <br />
                <span className="text-gradient">TRANSFORM?</span>
              </h2>

              <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-lg">
                Start your journey today. Complete all 10 courses and graduate with a
                professional portfolio and investor-ready pitch.
              </p>

              <Button size="lg" variant="neon" asChild className="text-lg px-12 h-14 btn-cyber">
                <Link to="/auth?mode=signup">
                  <Rocket className="mr-2 h-5 w-5" />
                  Launch Your Journey
                </Link>
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="font-mono">Lifetime access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="font-mono">AI-powered feedback</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
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
