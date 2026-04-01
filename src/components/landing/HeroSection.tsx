/**
 * @file HeroSection.tsx — Landing page hero with CTA
 * 
 * Features neon-glow headings, terminal-style badge,
 * animated orb backgrounds, and dual CTA buttons.
 * Mobile-first responsive sizing for all viewports.
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Terminal, Cpu } from 'lucide-react';
import { UIFrame } from '@/components/landing/UIFrame';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 md:py-36 nebula-section">
      {/* Animated orb background effects — opacity-only for performance */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute top-0 left-1/4 w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full blur-[150px] animate-orb-glow-primary will-change-[opacity]"
          style={{ background: 'hsl(270 100% 70% / 0.15)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full blur-[150px] animate-orb-glow-secondary will-change-[opacity]"
          style={{ animationDelay: '1s', background: 'hsl(185 100% 55% / 0.12)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[800px] h-[500px] md:h-[800px] rounded-full blur-[200px] animate-orb-glow-accent will-change-[opacity]"
          style={{ animationDelay: '2s', background: 'hsl(320 100% 65% / 0.12)' }}
        />
      </div>

      <div className="container relative px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Terminal-style badge */}
          <div className="mb-6 md:mb-8 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-mono border border-secondary/40 bg-secondary/10 rounded-full inline-flex items-center shadow-[0_0_20px_hsl(185_100%_55%/0.2)] animate-pulse-glow">
            <Terminal className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" />
            <span className="text-secondary">&gt;</span> AI-Powered Learning for Solo Founders
          </div>

          {/* H1 with neon glow animation — responsive sizing */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tight mb-6 md:mb-8 leading-[1.1]">
            <span className="text-foreground animate-neon-glow inline-block">BUILD YOUR</span>
            <br />
            <span className="text-nebula animate-flicker">DREAM BUSINESS</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed font-sans px-2">
            10 comprehensive courses designed for solo founders. From mindset to market to money—
            graduate with a professional portfolio and investor-ready pitch.
          </p>

          {/* CTA Buttons with UI Frame */}
          <UIFrame className="inline-block p-4 sm:p-6" scanline color="secondary">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button size="lg" variant="neon" asChild className="text-base sm:text-lg px-6 sm:px-10 h-12 sm:h-14 btn-cyber w-full sm:w-auto">
                <Link to="/auth?mode=signup">
                  <Cpu className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Initialize Journey
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                asChild
                className="text-base sm:text-lg px-6 sm:px-10 h-12 sm:h-14 btn-cyber w-full sm:w-auto bg-gradient-to-r from-[hsl(220_80%_55%)] to-[hsl(270_80%_55%)] text-primary-foreground shadow-[0_0_20px_hsl(245_80%_55%/0.4)] hover:shadow-[0_0_30px_hsl(245_80%_55%/0.5)] hover:scale-[1.02] transition-all duration-300"
              >
                <Link to="/courses">
                  <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  View Courses
                </Link>
              </Button>
            </div>
          </UIFrame>

          {/* Academy highlights — responsive grid on small screens */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-4 sm:gap-8 mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-primary/20 relative">
            <div className="cosmic-divider absolute top-0 left-0 right-0" />
            {[
              { value: '10', label: 'Expert Courses', hoverColor: 'group-hover:text-primary' },
              { value: '3', label: 'Learning Phases', hoverColor: 'group-hover:text-secondary' },
              { value: '$49-69', label: 'Per Course', hoverColor: 'group-hover:text-accent' },
              { value: '∞', label: 'Lifetime Access', hoverColor: 'group-hover:text-primary' },
            ].map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className={`text-2xl sm:text-3xl font-display font-bold text-foreground ${stat.hoverColor} transition-colors`}>
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-mono">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
