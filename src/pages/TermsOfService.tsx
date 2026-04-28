/**
 * @file TermsOfService.tsx — Terms of Service
 *
 * Production-ready draft tailored to SoloSuccess Academy:
 * lifetime-access digital courses, AI-assisted features, MFA-secured
 * accounts, Stripe payments, Delaware governing law, and EU/UK rights.
 * Not legal advice — see LegalDisclaimer.
 */
import { PageMeta } from '@/components/layout/PageMeta';
import { LegalDisclaimer } from '@/components/legal/LegalDisclaimer';

const LEGAL_EMAIL = 'legal@solosuccessacademy.cloud';
const LAST_UPDATED = 'April 28, 2026';

export default function TermsOfService() {
  return (
    <div className="container max-w-3xl py-16 relative z-10">
      <PageMeta
        title="Terms of Service"
        description="SoloSuccess Academy Terms of Service — the rules and rights that govern your use of our platform and courses."
        path="/terms"
      />

      <h1 className="text-4xl font-display font-bold mb-2 neon-text">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8 font-mono">Last updated: {LAST_UPDATED}</p>

      <LegalDisclaimer />

      <div className="prose prose-invert max-w-none space-y-8 text-foreground/80">
        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">1. Agreement to Terms</h2>
          <p>
            These Terms of Service (“Terms”) form a binding agreement between you and SoloSuccess Academy
            (“SoloSuccess Academy,” “we,” “us,” or “our”), the operator of <strong>solosuccessacademy.cloud</strong> and
            related services (the “Service”). By creating an account, purchasing a course, or otherwise using the
            Service, you agree to these Terms and to our{' '}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> and{' '}
            <a href="/refund" className="text-primary hover:underline">Refund Policy</a>. If you do not agree, do not
            use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">2. Eligibility &amp; Age Requirement</h2>
          <p>
            You must be at least <strong>16 years old</strong> to create an account, and at least{' '}
            <strong>18 years old</strong> (or the age of legal majority in your jurisdiction) to make a purchase.
            By using the Service you represent that you meet these requirements and that the information you provide
            is accurate. The Service is not directed to children under 16, and we do not knowingly collect data from
            them. If we learn that we have, we will delete the account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">3. Your Account &amp; Security</h2>
          <p>You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. You agree to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Provide accurate registration information and keep it up to date.</li>
            <li>Verify your email address before accessing protected features.</li>
            <li>Enable two-factor authentication (MFA) where offered, and securely store any recovery codes we issue. You are solely responsible for the safekeeping of recovery codes; we cannot recover them for you.</li>
            <li>Notify us immediately at <a className="text-primary hover:underline" href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> of any unauthorized access.</li>
          </ul>
          <p className="mt-2">Sessions are automatically signed out after 30 minutes of inactivity for your protection.</p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">4. Courses, License &amp; Acceptable Use</h2>
          <p>
            When you purchase a course, we grant you a personal, non-exclusive, non-transferable, revocable license
            to access the course content for your own educational and business-building purposes for the lifetime of
            the Service. You may <strong>not</strong>:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Reproduce, redistribute, resell, or publicly display course content;</li>
            <li>Share account access or recovery codes with anyone else;</li>
            <li>Scrape, bulk-download, or reverse-engineer the platform or its content;</li>
            <li>Submit plagiarized work, manipulate grading systems, or abuse AI features;</li>
            <li>Post unlawful, harassing, defamatory, or sexually explicit content in discussions;</li>
            <li>Interfere with the security, integrity, or availability of the Service.</li>
          </ul>
          <p className="mt-2">We may suspend or revoke access (including issued certificates) for violations, with or without notice.</p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">5. AI-Assisted Features (Important Disclosure)</h2>
          <p>
            The Service uses third-party large language models and other AI services (currently including Google
            Gemini, OpenAI, ElevenLabs, and Runway) to power features such as the AI Tutor, content explanations,
            essay grading, project feedback, and voice/image generation. You acknowledge and agree that:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>AI output may be inaccurate.</strong> Outputs are generated probabilistically and may contain errors, omissions, or “hallucinations.” Do not rely on AI output as professional, legal, financial, or medical advice.</li>
            <li><strong>Your inputs are processed by third parties.</strong> Prompts and submissions you send to AI features are transmitted to our AI providers for processing. We do not knowingly allow AI providers to use your inputs to train their public models, but we cannot guarantee the practices of every provider.</li>
            <li><strong>Grading assistance is advisory.</strong> AI-assisted grades and feedback may be reviewed and adjusted by SoloSuccess Academy. Final grades and certificates are at our discretion.</li>
            <li><strong>Don't submit sensitive personal data.</strong> Avoid pasting government IDs, payment data, health information, or third-party confidential material into AI features.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">6. User Content</h2>
          <p>
            You retain ownership of the assignments, projects, comments, and other content you submit (“User
            Content”). You grant SoloSuccess Academy a worldwide, royalty-free, non-exclusive license to host,
            store, reproduce, display, and process your User Content solely as needed to operate the Service
            (including grading, peer discussion, certificate issuance, and AI processing as described above). You
            represent that you have the rights to submit your User Content and that it does not infringe any third
            party's rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">7. Intellectual Property</h2>
          <p>
            All curriculum, written content, code, designs, branding, certificates, and platform software are owned
            by SoloSuccess Academy or its licensors and are protected by copyright and other intellectual-property
            laws. Except for the limited license in Section 4, no rights are granted to you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">8. Payments &amp; Pricing</h2>
          <p>
            Payments are processed by <strong>Stripe, Inc.</strong> SoloSuccess Academy does not store full card
            numbers. Prices are listed in U.S. Dollars and are exclusive of any taxes that may apply in your
            jurisdiction. We may change pricing at any time, but changes do not affect courses you have already
            purchased. Course access is granted as “lifetime access” for as long as the Service remains operational.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">9. Refunds</h2>
          <p>
            We offer a <strong>14-day, no-questions-asked refund</strong> on each individual course purchase. Full
            details, exceptions, and how to request a refund are described in our{' '}
            <a href="/refund" className="text-primary hover:underline">Refund Policy</a>, which is incorporated into
            these Terms by reference.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">10. Certificates</h2>
          <p>
            Certificates of completion are issued when you satisfy a course's requirements. Certificates are
            verifiable through our public verification page but are <strong>not</strong> accredited academic
            credentials and do not confer any professional license or degree. We may revoke certificates obtained
            through fraud, plagiarism, or violation of these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">11. Disclaimers</h2>
          <p>
            The Service is provided on an <strong>“AS IS” and “AS AVAILABLE”</strong> basis without warranties of
            any kind, whether express or implied, including warranties of merchantability, fitness for a particular
            purpose, non-infringement, or that the Service will be uninterrupted, secure, or error-free.
            SoloSuccess Academy makes no guarantee that following our courses will produce any specific business,
            financial, or income result. Your outcomes depend on your effort, market conditions, and many other
            factors outside our control.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">12. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, SoloSuccess Academy and its owners, employees, and contractors
            will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages,
            or for lost profits, revenues, data, or business opportunities, arising out of or related to the
            Service. Our total cumulative liability for any claim arising from or related to the Service is limited
            to the greater of (a) the amount you paid us in the 12 months preceding the claim, or (b) USD $100.
          </p>
          <p className="mt-2">
            <strong>Nothing in these Terms limits liability that cannot be limited by law</strong>, including
            liability for fraud, gross negligence, or wilful misconduct, or any statutory rights of consumers in
            their country of residence (see Section 16).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">13. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless SoloSuccess Academy from any claims, damages, or expenses
            (including reasonable legal fees) arising from your User Content, your violation of these Terms, or your
            violation of any law or third-party right.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">14. Termination</h2>
          <p>
            You may close your account at any time from your settings or by contacting{' '}
            <a className="text-primary hover:underline" href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>. We may
            suspend or terminate your access if you breach these Terms, abuse the Service, or if required by law.
            Sections that by their nature should survive termination (including IP, disclaimers, liability, and
            governing law) will survive.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">15. Governing Law &amp; Dispute Resolution</h2>
          <p>
            These Terms are governed by the laws of the <strong>State of Delaware, United States</strong>, without
            regard to its conflict-of-laws rules. The U.N. Convention on Contracts for the International Sale of
            Goods does not apply.
          </p>
          <p className="mt-2">
            <strong>Informal resolution first.</strong> Before filing any formal claim, you agree to contact us at{' '}
            <a className="text-primary hover:underline" href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> and try in
            good faith to resolve the dispute for at least 60 days.
          </p>
          <p className="mt-2">
            <strong>Binding arbitration.</strong> If the dispute is not resolved, you and SoloSuccess Academy agree
            to resolve it through final and binding individual arbitration administered under the rules of a
            recognized arbitration body (such as the American Arbitration Association) seated in{' '}
            <strong>Wilmington, Delaware</strong>, with the language of the proceedings in English.{' '}
            <strong>You and SoloSuccess Academy waive any right to a jury trial and to participate in a class or
            representative action.</strong> Either party may bring claims in small-claims court for matters within
            its jurisdiction. You may opt out of arbitration by sending written notice to{' '}
            <a className="text-primary hover:underline" href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> within 30
            days of first accepting these Terms.
          </p>
          <p className="mt-2">
            If arbitration is unavailable or the waiver is unenforceable, the parties consent to the exclusive
            jurisdiction of the state and federal courts located in <strong>New Castle County, Delaware</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">16. EU, UK &amp; Other Local Consumer Rights</h2>
          <p>
            If you are a consumer in the European Union, the United Kingdom, the European Economic Area, or another
            jurisdiction whose mandatory consumer-protection laws apply, nothing in these Terms (including the
            governing-law and arbitration sections) deprives you of rights you cannot waive under your local law.
            EU/EEA consumers may also access the European Commission's Online Dispute Resolution platform at{' '}
            <a className="text-primary hover:underline" href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer noopener">ec.europa.eu/consumers/odr</a>.
            UK consumers retain rights under the Consumer Rights Act 2015.
          </p>
          <p className="mt-2">
            <strong>Digital-content withdrawal.</strong> Because our courses are digital content delivered
            immediately, you expressly consent that performance begins as soon as you access any lesson, and you
            acknowledge that this causes any statutory withdrawal right (e.g., the EU 14-day cooling-off right) to
            be lost on first access. Our voluntary 14-day refund policy in Section 9 still applies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">17. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. If changes are material, we will notify registered users by
            email and/or in-app notice at least 14 days before they take effect. Continued use after the effective
            date constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">18. Miscellaneous</h2>
          <p>
            These Terms are the entire agreement between you and SoloSuccess Academy regarding the Service. If any
            provision is held unenforceable, the remaining provisions remain in effect. Our failure to enforce any
            provision is not a waiver. You may not assign these Terms without our consent; we may assign them in
            connection with a merger, acquisition, or sale of assets.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">19. Contact</h2>
          <p>
            Questions about these Terms? Email{' '}
            <a className="text-primary hover:underline" href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> or use our{' '}
            <a href="/contact" className="text-primary hover:underline">contact form</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
