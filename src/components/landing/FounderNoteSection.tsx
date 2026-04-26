/**
 * @file FounderNoteSection.tsx — Authentic founder/instructor note
 *
 * Replaces fake testimonials with a genuine "letter from the founder"
 * to build trust without inventing reviews. Per project memory: no fake
 * social proof.
 */
import { Quote } from 'lucide-react';

export function FounderNoteSection() {
  return (
    <section className="py-20 md:py-24 relative nebula-section">
      <div className="cosmic-divider mb-12 md:mb-16" />
      <div className="container px-4 sm:px-6 max-w-3xl">
        <div className="data-card p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

          <div className="relative">
            <Quote className="h-10 w-10 text-primary/40 mb-6" aria-hidden />

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-6 text-foreground">
              Why this academy exists
            </h2>

            <div className="space-y-4 text-foreground/80 text-base sm:text-lg leading-relaxed font-sans">
              <p>
                Most "start your business" courses teach you frameworks. They don't teach you
                how to actually <span className="text-primary font-semibold">do the work</span> —
                wireframe a product, write a sales page, set up a landing page, file an LLC,
                handle your first refund, or pitch an investor.
              </p>
              <p>
                SoloSuccess Academy is built around the opposite philosophy: every lesson ends
                with something you've <em>made</em>. By the time you finish all 10 courses,
                you don't have a stack of notes — you have a working business and a portfolio
                that proves it.
              </p>
              <p>
                We use AI tutors so you're never stuck waiting for a teacher. We price low so
                solo founders can afford it. And we offer a 30-day refund on every course
                because we'd rather earn your trust than your money.
              </p>
              <p className="text-foreground font-semibold">
                If that resonates, you're in the right place.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-primary/20">
              <p className="text-sm font-mono text-muted-foreground">
                — The SoloSuccess Academy team
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
