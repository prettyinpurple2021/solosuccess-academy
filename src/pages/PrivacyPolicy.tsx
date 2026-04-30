/**
 * @file PrivacyPolicy.tsx — Privacy Policy
 *
 * Production-ready draft tailored to SoloSuccess Academy:
 * Stripe payments, AI processing, MFA recovery codes, EU/UK GDPR rights,
 * California CCPA/CPRA disclosures, and Delaware governing law.
 */
import { PageMeta } from '@/components/layout/PageMeta';
import { LegalDisclaimer } from '@/components/legal/LegalDisclaimer';

const LEGAL_EMAIL = 'legal@solosuccessacademy.cloud';
const LAST_UPDATED = 'April 28, 2026';

export default function PrivacyPolicy() {
  return (
    <div className="container max-w-3xl py-16 relative z-10">
      <PageMeta
        title="Privacy Policy"
        description="SoloSuccess Academy Privacy Policy — what we collect, how we use it, who we share it with, and your rights."
        path="/privacy"
      />

      <h1 className="text-4xl font-display font-bold mb-2 neon-text">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8 font-mono">Last updated: {LAST_UPDATED}</p>

      <LegalDisclaimer />

      <div className="prose prose-invert max-w-none space-y-8 text-foreground/80">
        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">1. Who We Are</h2>
          <p>
            SoloSuccess Academy (“we,” “us,” or “our”) operates <strong>solosuccessacademy.cloud</strong>. We are
            the data controller for personal data processed in connection with the Service. Contact us at{' '}
            <a className="text-primary hover:underline" href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> for any
            privacy questions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">2. Information We Collect</h2>
          <p><strong>Information you provide:</strong></p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Account: email address, display name, password hash, optional avatar and bio.</li>
            <li>Authentication &amp; security: email verification status, MFA enrollment status, and hashed recovery-code lookups (we never store recovery codes in plaintext).</li>
            <li>Learning content: assignments, essays, project submissions, worksheet answers, discussion posts, highlights, and notes.</li>
            <li>Communications: messages you send through our contact form or support channels.</li>
          </ul>
          <p className="mt-3"><strong>Information collected automatically:</strong></p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Usage data: course progress, lesson completion, quiz scores, reading time, XP, badges, login times, and IP address (used to keep you signed in and prevent abuse).</li>
            <li>Device data: browser type, operating system, and screen size for responsive rendering and bug diagnostics.</li>
            <li>Essential cookies: a single secure session cookie that keeps you signed in. We do not use advertising or cross-site tracking cookies.</li>
          </ul>
          <p className="mt-3"><strong>Information from third parties:</strong></p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Stripe sends us your purchase status, last 4 digits of your card, and payment country. We never receive your full card number.</li>
            <li>If you sign in with a social provider, we receive the email and name you authorize that provider to share.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
          <p>We use your data only for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Provide and maintain your account and access to purchased courses.</li>
            <li>Track learning progress, grades, badges, certificates, and leaderboard standing.</li>
            <li>Process AI-assisted features such as the AI Tutor, content explanations, essay grading, and project feedback (see Section 5).</li>
            <li>Process payments and prevent fraud through Stripe.</li>
            <li>Send transactional and security emails (account verification, password reset, MFA challenges, purchase receipts, refund confirmations, important account notices).</li>
            <li>Send course-related notifications when you opt in; you can unsubscribe at any time from any non-essential email.</li>
            <li>Maintain platform security, investigate abuse, and comply with legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">4. Legal Bases (EU/UK GDPR)</h2>
          <p>If you are in the EU, EEA, or UK, we rely on the following legal bases:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Contract:</strong> to provide the Service you purchased and operate your account.</li>
            <li><strong>Legitimate interests:</strong> to secure the Service, prevent fraud, and improve the platform — balanced against your rights and interests.</li>
            <li><strong>Consent:</strong> for non-essential communications and certain optional features. You may withdraw consent at any time.</li>
            <li><strong>Legal obligation:</strong> to comply with tax, accounting, and lawful requests from authorities.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">5. AI Processing &amp; Sub-Processors</h2>
          <p>
            When you use AI-assisted features, your prompts and submissions are transmitted to third-party AI
            providers solely to generate the response shown to you. Current AI sub-processors include:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Google (Gemini)</strong> — text and image reasoning.</li>
            <li><strong>OpenAI</strong> — text reasoning for selected features.</li>
            <li><strong>ElevenLabs</strong> — voice generation.</li>
            <li><strong>Runway</strong> — video generation.</li>
          </ul>
          <p className="mt-2">
            We instruct these providers not to use your inputs to train their public models, but we do not control
            their independent practices. Please avoid sending sensitive personal data, government IDs, or third-party
            confidential information into AI features. AI output may be inaccurate and is provided for educational
            assistance only.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">6. Other Sub-Processors</h2>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Supabase / managed cloud backend</strong> — database hosting, authentication, file storage.</li>
            <li><strong>Vercel</strong> — front-end hosting and CDN.</li>
            <li><strong>Stripe</strong> — payment processing (PCI-DSS Level 1).</li>
            <li><strong>Resend</strong> (or our then-current email provider) — transactional email delivery from <code className="font-mono">notify.solosuccessacademy.cloud</code>.</li>
          </ul>
          <p className="mt-2">
            All sub-processors are contractually bound to safeguard your data and use it only for the services they
            provide to us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">7. Sharing Your Information</h2>
          <p>We <strong>do not sell or rent</strong> your personal data. We share data only:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>With sub-processors listed above, under data-processing agreements.</li>
            <li>With other learners — only the public profile information you choose (display name, avatar, badges, leaderboard entry) and any discussion posts you publish.</li>
            <li>If required by law, court order, or to protect the rights, safety, and property of SoloSuccess Academy or others.</li>
            <li>In connection with a merger, acquisition, or sale of assets, in which case we will notify you and any successor will be bound by this Policy.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">8. International Data Transfers</h2>
          <p>
            We are based in the United States, and our sub-processors operate globally. If you access the Service
            from outside the U.S., your data will be transferred to and processed in the U.S. and other countries.
            Where required, we rely on the European Commission's Standard Contractual Clauses (SCCs) and the UK's
            International Data Transfer Addendum to safeguard cross-border transfers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">9. Security</h2>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Data is encrypted in transit (TLS) and at rest in our cloud database.</li>
            <li>Passwords are hashed; recovery codes are stored only as one-way hashes.</li>
            <li>Two-factor authentication (MFA) is available on every account and recommended.</li>
            <li>Row-level security ensures you can only access your own data.</li>
            <li>Sessions automatically time out after 30 minutes of inactivity.</li>
            <li>Storage buckets containing your uploads are private and accessed via short-lived signed URLs.</li>
          </ul>
          <p className="mt-2">
            No system is perfectly secure. If we discover a breach affecting your personal data, we will notify
            affected users without undue delay and as required by law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">10. Data Retention</h2>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Account and learning data: kept while your account is active.</li>
            <li>After account deletion: most data is removed within 30 days; backups containing residual copies are rotated within 90 days.</li>
            <li>Purchase and tax records: retained for up to 7 years to meet financial and tax obligations.</li>
            <li>Anonymized usage statistics may be kept indefinitely for analytics.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">11. Your Rights</h2>
          <p>
            Depending on where you live, you may have the right to <strong>access</strong>, <strong>correct</strong>,{' '}
            <strong>delete</strong>, <strong>port</strong>, <strong>restrict</strong>, or <strong>object</strong> to
            our processing of your personal data, and to <strong>withdraw consent</strong> at any time.
          </p>
          <p className="mt-2">
            <strong>EU/UK/EEA residents (GDPR):</strong> you may exercise the rights above and lodge a complaint
            with your local data-protection authority. The UK's authority is the ICO (<a className="text-primary hover:underline" href="https://ico.org.uk" target="_blank" rel="noreferrer noopener">ico.org.uk</a>).
          </p>
          <p className="mt-2">
            <strong>California residents (CCPA/CPRA):</strong> you have the right to know what personal information
            we collect, to delete it, to correct inaccurate information, and to opt out of any “sale” or “sharing”
            of your personal information. <strong>We do not sell or share your personal information</strong> as
            those terms are defined under California law. You will not be discriminated against for exercising your
            rights.
          </p>
          <p className="mt-2">
            To exercise any right, email{' '}
            <a className="text-primary hover:underline" href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> from the
            address on your account, or use the in-app account-deletion tool in Settings. We will respond within 30
            days (or as required by your local law).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">12. Children's Privacy</h2>
          <p>
            The Service is not intended for children under 16. We do not knowingly collect personal data from
            children under 16. If you believe we have, contact us and we will delete the account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">13. Cookies</h2>
          <p>
            We use only <strong>strictly necessary cookies</strong>: a secure session cookie to keep you signed in
            and a small localStorage entry to remember UI preferences (such as reduced motion or that you've seen
            the cookie notice). We do not use third-party advertising or cross-site tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">14. Changes to This Policy</h2>
          <p>
            We may update this Policy from time to time. Material changes will be communicated by email or in-app
            notice at least 14 days before they take effect. The “Last updated” date at the top of this page always
            reflects the current version.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">15. Contact</h2>
          <p>
            Privacy questions, requests, or complaints? Email{' '}
            <a className="text-primary hover:underline" href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> or use our{' '}
            <a href="/contact" className="text-primary hover:underline">contact form</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
