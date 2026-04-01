/**
 * @file PricingSection.tsx — Simple pricing tiers
 * 
 * Shows per-course, phase bundle, and full academy pricing
 * with honest, transparent information. Mobile-first layout.
 */
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, DollarSign, Target, Trophy } from 'lucide-react';
import { UIFrame } from '@/components/landing/UIFrame';

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-24 relative nebula-section">
      <div className="cosmic-divider mb-12 md:mb-16" />

      <div className="container relative px-4 sm:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4 md:mb-6">
            <span className="text-nebula animate-neon-glow inline-block">SIMPLE PRICING</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Pay per course. No subscriptions. Lifetime access to everything you purchase.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
          {/* Per Course */}
          <div className="data-card p-6 sm:p-8 text-center">
            <div className="h-14 w-14 sm:h-16 sm:w-16 mx-auto rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mb-4">
              <DollarSign className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-1">Per Course</h3>
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4">Individual course access</p>
            <div className="text-3xl sm:text-4xl font-display font-bold text-primary mb-4">$49 - $69</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />Lifetime access</li>
              <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />AI tutor included</li>
              <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />Certificate on completion</li>
            </ul>
          </div>

          {/* Complete Phase — highlighted */}
          <UIFrame color="primary" className="p-0">
            <div className="data-card p-6 sm:p-8 text-center border-primary/40 shadow-[0_0_30px_hsl(270_80%_60%/0.15)]">
              <Badge className="w-fit mx-auto mb-4 bg-primary/20 text-primary border-primary/30">Most Popular</Badge>
              <div className="h-14 w-14 sm:h-16 sm:w-16 mx-auto rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mb-4">
                <Target className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-1">Complete Phase</h3>
              <p className="text-sm text-muted-foreground mb-3 sm:mb-4">3-4 courses bundled</p>
              <div className="text-3xl sm:text-4xl font-display font-bold text-primary mb-4">~$200</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />All phase courses</li>
                <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />Project-based learning</li>
                <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />Community access</li>
              </ul>
            </div>
          </UIFrame>

          {/* Full Academy */}
          <div className="data-card p-6 sm:p-8 text-center">
            <div className="h-14 w-14 sm:h-16 sm:w-16 mx-auto rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center mb-4">
              <Trophy className="h-7 w-7 sm:h-8 sm:w-8 text-accent" />
            </div>
            <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-1">Full Academy</h3>
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4">All 10 courses</p>
            <div className="text-3xl sm:text-4xl font-display font-bold text-accent mb-4">~$590</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />Complete curriculum</li>
              <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />Portfolio website</li>
              <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />Pitch presentation</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
