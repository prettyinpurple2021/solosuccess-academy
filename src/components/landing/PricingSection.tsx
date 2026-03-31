/**
 * @file PricingSection.tsx — Simple pricing tiers
 * 
 * Shows per-course, phase bundle, and full academy pricing
 * with honest, transparent information.
 */
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, DollarSign, Target, Trophy } from 'lucide-react';
import { UIFrame } from '@/components/landing/UIFrame';

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 relative nebula-section">
      <div className="cosmic-divider mb-16" />

      <div className="container relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            <span className="text-nebula animate-neon-glow inline-block">SIMPLE PRICING</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Pay per course. No subscriptions. Lifetime access to everything you purchase.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Per Course */}
          <div className="data-card p-8 text-center">
            <div className="h-16 w-16 mx-auto rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mb-4">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-foreground mb-1">Per Course</h3>
            <p className="text-sm text-muted-foreground mb-4">Individual course access</p>
            <div className="text-4xl font-display font-bold text-primary mb-4">$49 - $69</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />Lifetime access</li>
              <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />AI tutor included</li>
              <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />Certificate on completion</li>
            </ul>
          </div>

          {/* Complete Phase — highlighted */}
          <UIFrame color="primary" className="p-0">
            <div className="data-card p-8 text-center border-primary/40 shadow-[0_0_30px_hsl(270_80%_60%/0.15)]">
              <Badge className="w-fit mx-auto mb-4 bg-primary/20 text-primary border-primary/30">Most Popular</Badge>
              <div className="h-16 w-16 mx-auto rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-foreground mb-1">Complete Phase</h3>
              <p className="text-sm text-muted-foreground mb-4">3-4 courses bundled</p>
              <div className="text-4xl font-display font-bold text-primary mb-4">~$200</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />All phase courses</li>
                <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />Project-based learning</li>
                <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />Community access</li>
              </ul>
            </div>
          </UIFrame>

          {/* Full Academy */}
          <div className="data-card p-8 text-center">
            <div className="h-16 w-16 mx-auto rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-foreground mb-1">Full Academy</h3>
            <p className="text-sm text-muted-foreground mb-4">All 10 courses</p>
            <div className="text-4xl font-display font-bold text-accent mb-4">~$590</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />Complete curriculum</li>
              <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />Portfolio website</li>
              <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />Pitch presentation</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
