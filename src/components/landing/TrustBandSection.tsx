/**
 * @file TrustBandSection.tsx — "Built with" credibility strip
 *
 * Honest trust signals: technologies, security posture, refund guarantee.
 * No invented reviews. Sits just above the pricing section.
 */
import { Shield, Lock, RefreshCw, Sparkles } from 'lucide-react';

const items = [
  {
    icon: Shield,
    title: '30-Day Guarantee',
    desc: 'Money back, no questions asked',
  },
  {
    icon: Lock,
    title: 'Secure Checkout',
    desc: 'Powered by Stripe, PCI-compliant',
  },
  {
    icon: RefreshCw,
    title: 'Lifetime Updates',
    desc: 'Course content keeps evolving',
  },
  {
    icon: Sparkles,
    title: 'AI Tutor Included',
    desc: '24/7 personalized help',
  },
];

export function TrustBandSection() {
  return (
    <section className="py-12 md:py-16 relative">
      <div className="container px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
          {items.map((item) => (
            <div
              key={item.title}
              className="data-card p-4 sm:p-5 text-center border border-primary/20 hover:border-primary/40 transition-colors"
            >
              <item.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary mx-auto mb-2" />
              <h3 className="text-sm sm:text-base font-heading font-semibold text-foreground mb-1">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-tight font-mono">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
