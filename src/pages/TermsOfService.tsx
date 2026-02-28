/**
 * @file TermsOfService.tsx — Terms of Service Page
 * 
 * Displays the academy's terms of service with placeholder legal content.
 */
import { PageMeta } from '@/components/layout/PageMeta';

export default function TermsOfService() {
  return (
    <div className="container max-w-3xl py-16 relative z-10">
      <PageMeta
        title="Terms of Service"
        description="SoloSuccess Academy Terms of Service — the rules and guidelines for using our platform."
        path="/terms"
      />

      <h1 className="text-4xl font-display font-bold mb-8 neon-text">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8 font-mono">Last updated: February 28, 2026</p>

      <div className="prose prose-invert max-w-none space-y-8 text-foreground/80">
        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
          <p>By creating an account or using SoloSuccess Academy, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">2. Account Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration and keep it up to date. You may not share your account with others or allow unauthorized access.</p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">3. Course Access & Licenses</h2>
          <p>When you purchase a course, you receive a personal, non-transferable, non-exclusive license to access and view the course content for your own educational purposes. You may not:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Reproduce, redistribute, or resell any course content</li>
            <li>Share your account access with others</li>
            <li>Use course materials for commercial purposes without written permission</li>
            <li>Reverse-engineer or scrape platform content</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">4. Intellectual Property</h2>
          <p>All course content, curriculum, design, code, images, and branding are the exclusive intellectual property of SoloSuccess Academy. See our <a href="/legal" className="text-primary hover:underline">Legal page</a> for full copyright details.</p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">5. User Conduct</h2>
          <p>You agree to use the platform respectfully. Prohibited behavior includes:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Posting offensive, harassing, or inappropriate content in discussions</li>
            <li>Attempting to exploit, hack, or disrupt the platform</li>
            <li>Submitting plagiarized work for assignments or essays</li>
            <li>Creating multiple accounts to bypass restrictions</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">6. Payments</h2>
          <p>All payments are processed securely through Stripe. Prices are listed in USD and are subject to change. You will be charged the price displayed at the time of purchase.</p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">7. Certificates</h2>
          <p>Certificates of completion are issued upon meeting all course requirements. Certificates are verifiable but do not constitute accredited academic credentials.</p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">8. Limitation of Liability</h2>
          <p>SoloSuccess Academy is provided "as is" without warranties. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability is limited to the amount you paid for the specific course in question.</p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">9. Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time by contacting support.</p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">10. Changes to Terms</h2>
          <p>We may update these terms as needed. Continued use of the platform after changes constitutes acceptance of the revised terms.</p>
        </section>
      </div>
    </div>
  );
}
