/**
 * @file RefundPolicy.tsx — Refund Policy Page
 * 
 * Displays the academy's refund policy with placeholder legal content.
 */
import { PageMeta } from '@/components/layout/PageMeta';

export default function RefundPolicy() {
  return (
    <div className="container max-w-3xl py-16 relative z-10">
      <PageMeta
        title="Refund Policy"
        description="SoloSuccess Academy Refund Policy — our guidelines for course refunds and satisfaction guarantee."
        path="/refund"
      />

      <h1 className="text-4xl font-display font-bold mb-8 neon-text">Refund Policy</h1>
      <p className="text-sm text-muted-foreground mb-8 font-mono">Last updated: February 28, 2026</p>

      <div className="prose prose-invert max-w-none space-y-8 text-foreground/80">
        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">30-Day Satisfaction Guarantee</h2>
          <p>We want you to be completely satisfied with your learning experience. If a course doesn't meet your expectations, you may request a full refund within <strong>30 days</strong> of purchase — no questions asked.</p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">Eligibility</h2>
          <p>To be eligible for a refund:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>The refund request must be made within 30 days of the original purchase date</li>
            <li>You must not have completed more than 50% of the course content</li>
            <li>You must not have received a certificate of completion for the course</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">How to Request a Refund</h2>
          <p>To request a refund, contact us through our official support channels with your account email and the course name. We aim to process all refund requests within 5–7 business days.</p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">Refund Method</h2>
          <p>Refunds are issued to the original payment method used at the time of purchase. Processing times may vary depending on your financial institution.</p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">Non-Refundable Items</h2>
          <p>The following are not eligible for refunds:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Courses where more than 50% of lessons have been completed</li>
            <li>Courses where a certificate has already been issued</li>
            <li>Requests made more than 30 days after purchase</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">Disputes</h2>
          <p>If you are unsatisfied with a refund decision, please contact us to discuss. We are committed to resolving all concerns fairly.</p>
        </section>
      </div>
    </div>
  );
}
