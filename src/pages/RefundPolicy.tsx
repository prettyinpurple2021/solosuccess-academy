/**
 * @file RefundPolicy.tsx — Refund Policy
 *
 * Production-ready 14-day, no-questions-asked refund policy with
 * exceptions, EU/UK consumer rights, and Stripe processing details.
 */
import { PageMeta } from '@/components/layout/PageMeta';
import { LegalDisclaimer } from '@/components/legal/LegalDisclaimer';

const LEGAL_EMAIL = 'legal@solosuccessacademy.cloud';
const LAST_UPDATED = 'April 28, 2026';

export default function RefundPolicy() {
  return (
    <div className="container max-w-3xl py-16 relative z-10">
      <PageMeta
        title="Refund Policy"
        description="SoloSuccess Academy Refund Policy — our 14-day, no-questions-asked refund guarantee and how to request one."
        path="/refund"
      />

      <h1 className="text-4xl font-display font-bold mb-2 neon-text">Refund Policy</h1>
      <p className="text-sm text-muted-foreground mb-8 font-mono">Last updated: {LAST_UPDATED}</p>

      <LegalDisclaimer />

      <div className="prose prose-invert max-w-none space-y-8 text-foreground/80">
        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">1. The 14-Day Guarantee</h2>
          <p>
            We want you to feel confident investing in your education. Every individual course purchase from
            SoloSuccess Academy is covered by a <strong>14-day, no-questions-asked refund guarantee</strong>.
          </p>
          <p className="mt-2">
            If you're not satisfied for any reason, request a refund within <strong>14 calendar days</strong> of
            the original purchase date and we will refund the full amount you paid for that course — no
            justification required.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">2. How to Request a Refund</h2>
          <ol className="list-decimal pl-6 space-y-2 mt-2">
            <li>
              Email <a className="text-primary hover:underline" href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>{' '}
              from the address on your account, or use our{' '}
              <a href="/contact" className="text-primary hover:underline">contact form</a>.
            </li>
            <li>Include your order receipt or the email address you used to purchase.</li>
            <li>Tell us which course you want refunded (you don't need to explain why).</li>
          </ol>
          <p className="mt-2">
            We typically confirm refund requests within <strong>2 business days</strong> and ask Stripe to issue
            the refund the same day. Refunds usually appear on your original payment method within{' '}
            <strong>5–10 business days</strong>, depending on your bank or card issuer.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">3. After Your Refund</h2>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Access to the refunded course is revoked.</li>
            <li>Any certificate of completion issued for that course is revoked and removed from public verification.</li>
            <li>Your account, progress on other courses, and any earned XP/badges remain intact.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">4. What's Not Eligible</h2>
          <p>The 14-day guarantee covers normal good-faith purchases. We may decline or limit refunds in these cases:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>The request is made more than 14 days after the purchase date.</li>
            <li>The course was acquired through a coupon, scholarship, gift, or promotional credit (refund is limited to the actual amount paid, which may be $0).</li>
            <li>Evidence of <strong>abuse</strong>, such as completing the entire course and downloading all assets before requesting a refund, repeat refunds across multiple accounts, or chargeback fraud.</li>
            <li>Accounts terminated for violations of our <a href="/terms" className="text-primary hover:underline">Terms of Service</a>.</li>
          </ul>
          <p className="mt-2">
            We reserve the right to deny refund requests that we reasonably determine to be fraudulent or abusive.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">5. Bundles &amp; Multi-Course Purchases</h2>
          <p>
            If you purchased a bundle, you may request a refund of the entire bundle within 14 days. Partial refunds
            of individual courses inside a bundle are handled on a case-by-case basis at the bundle's per-course
            blended rate.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">6. Chargebacks</h2>
          <p>
            Please contact us before filing a chargeback with your bank — we can almost always resolve issues
            faster directly. Chargebacks filed without first contacting us may result in account suspension while
            the dispute is investigated.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">7. EU, UK &amp; Other Local Consumer Rights</h2>
          <p>
            Nothing in this Policy limits any non-waivable consumer-protection rights you have under your local
            law.
          </p>
          <p className="mt-2">
            <strong>EU/EEA &amp; UK consumers — digital-content withdrawal:</strong> Our courses are digital content
            delivered immediately upon purchase. By accessing any lesson before the end of the 14-day statutory
            withdrawal period, you expressly consent to immediate performance and acknowledge that your statutory
            withdrawal right is lost on first access. <strong>Our voluntary 14-day refund policy above still
            applies even after you've started a lesson</strong>, which is more generous than the statutory minimum.
          </p>
          <p className="mt-2">
            EU/EEA consumers may access the European Commission's Online Dispute Resolution platform at{' '}
            <a className="text-primary hover:underline" href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer noopener">ec.europa.eu/consumers/odr</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">8. Changes to This Policy</h2>
          <p>
            We may update this Refund Policy from time to time. The version in effect at the time of your purchase
            governs that purchase. Material changes will be announced at least 14 days before they take effect.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">9. Contact</h2>
          <p>
            Refund questions? Email{' '}
            <a className="text-primary hover:underline" href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> or use our{' '}
            <a href="/contact" className="text-primary hover:underline">contact form</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
