/**
 * @file PrivacyPolicy.tsx — Privacy Policy Page
 * 
 * Displays the academy's privacy policy with placeholder legal content.
 * Uses semantic HTML for accessibility and SEO.
 */
import { PageMeta } from '@/components/layout/PageMeta';

export default function PrivacyPolicy() {
  return (
    <div className="container max-w-3xl py-16 relative z-10">
      <PageMeta
        title="Privacy Policy"
        description="SoloSuccess Academy Privacy Policy — how we collect, use, and protect your data."
        path="/privacy"
      />

      <h1 className="text-4xl font-display font-bold mb-8 neon-text">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8 font-mono">Last updated: February 28, 2026</p>

      <div className="prose prose-invert max-w-none space-y-8 text-foreground/80">
        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">1. Information We Collect</h2>
          <p>When you create an account, we collect your email address, display name, and any profile information you choose to provide. We also collect usage data such as course progress, quiz scores, and platform interaction patterns to improve your learning experience.</p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Provide and maintain your account and access to purchased courses</li>
            <li>Track your learning progress, grades, and certifications</li>
            <li>Send important account notifications and course updates (if opted in)</li>
            <li>Improve our platform, curriculum, and user experience</li>
            <li>Process payments securely through our payment processor (Stripe)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">3. Data Storage & Security</h2>
          <p>Your data is stored securely using industry-standard encryption and cloud infrastructure. We implement row-level security policies to ensure you can only access your own data. Passwords are hashed and never stored in plain text.</p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">4. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Stripe</strong> — for secure payment processing. We never store your full credit card details.</li>
            <li><strong>AI Services</strong> — for AI tutoring, content generation, and essay grading. Your interactions may be processed by AI models but are not used to train third-party models.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Access and download your personal data</li>
            <li>Update or correct your information via your profile settings</li>
            <li>Delete your account and associated data by contacting us</li>
            <li>Opt out of non-essential email communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">6. Cookies</h2>
          <p>We use essential cookies to maintain your authentication session. We do not use third-party tracking cookies or advertising cookies.</p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">7. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify registered users of any material changes via email or in-app notification.</p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-foreground mb-3">8. Contact</h2>
          <p>For privacy-related inquiries, please reach out through our platform's official support channels.</p>
        </section>
      </div>
    </div>
  );
}
