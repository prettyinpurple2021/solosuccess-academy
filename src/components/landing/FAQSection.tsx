/**
 * @file FAQSection.tsx — Frequently Asked Questions
 *
 * Addresses top objections (refunds, time, AI quality, beginner-friendly,
 * accreditation, support). Critical conversion lever — answers the
 * "is this real?" / "is this for me?" questions before they bounce.
 */
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: 'Is this for complete beginners or experienced founders?',
    a: 'Both. Phase 1 (Initialization) starts from absolute zero — no prior business experience needed. Phases 2 and 3 dive into harder topics (operations, marketing, sales, fundraising) that experienced indie hackers will appreciate. You can take individual courses or the full path.',
  },
  {
    q: 'How does the 30-day money-back guarantee work?',
    a: "If a course doesn't meet your expectations, request a full refund within 30 days of purchase — provided you haven't completed more than 50% of lessons or claimed a certificate. Email us through the support page and we process refunds within 5–7 business days. No interrogation.",
  },
  {
    q: 'How much time do I need per week?',
    a: 'Self-paced. Most students spend 3–6 hours per week and complete a single course in 2–4 weeks. The full 10-course path is typically completed in 6–12 months at a steady pace. You have lifetime access — go as fast or slow as you want.',
  },
  {
    q: 'Is this an accredited degree?',
    a: 'No. SoloSuccess Academy issues verifiable certificates of completion, not accredited academic credentials. The value is the skills and the portfolio you build — not a piece of paper. Many of our students use the certificates on LinkedIn alongside their portfolio projects.',
  },
  {
    q: 'What is the AI tutor and how does it work?',
    a: 'Every lesson includes an AI tutor (powered by Google Gemini and OpenAI models) trained on the course context. Ask follow-up questions, request examples, get feedback on assignments, or ask for clarification any time — it knows what lesson you\'re on and adapts to your level. Your conversations are private and never used to train external models.',
  },
  {
    q: 'Do I need any tools or software to get started?',
    a: 'Just a laptop and a browser. No paid tools required for any course. We recommend free tools throughout (Notion, Figma, Canva, Google Docs, etc.) and link to free-tier alternatives for everything.',
  },
  {
    q: 'Can I download the videos or use it offline?',
    a: 'The platform is browser-based and requires an internet connection. Lesson content (text, worksheets, activities) is fast to load and works on slow connections. Video content streams from our CDN. PDF worksheets and downloadable templates can be saved for offline use.',
  },
  {
    q: 'What happens after I finish all 10 courses?',
    a: 'You graduate with: (1) a verifiable academy certificate, (2) a complete professional portfolio of real projects, (3) an investor-ready pitch deck, and (4) the skills and confidence to launch your business. Lifetime access to all updated course material continues indefinitely.',
  },
  {
    q: 'How do I get support if I get stuck?',
    a: 'Three channels: the AI tutor (24/7, instant), course discussion boards (peer + instructor), and email support for technical or billing issues. Most questions get answered within hours.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit and debit cards via Stripe (secure, PCI-compliant). We support payment in USD. Apple Pay and Google Pay are available at checkout where supported by your browser.',
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 md:py-24 relative nebula-section">
      <div className="cosmic-divider mb-12 md:mb-16" />
      <div className="container relative px-4 sm:px-6 max-w-4xl">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 text-xs font-mono border border-secondary/40 bg-secondary/10 rounded-full text-secondary">
            <HelpCircle className="h-3.5 w-3.5" />
            FAQ
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4 md:mb-6">
            <span className="text-foreground">YOUR QUESTIONS,</span>
            <br />
            <span className="text-gradient animate-neon-glow inline-block">ANSWERED</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Everything you need to know before joining the academy.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((item, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="data-card border border-primary/20 px-4 sm:px-6 rounded-lg"
            >
              <AccordionTrigger className="text-left font-heading text-base sm:text-lg hover:no-underline hover:text-primary py-4">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm sm:text-base leading-relaxed pb-4">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
