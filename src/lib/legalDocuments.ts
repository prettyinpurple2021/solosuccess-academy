/**
 * @file legalDocuments.ts — Single source of truth for all legal documents.
 *
 * Each document lives in `public/legal/<version>/<File>.pdf` so it's served
 * directly by the CDN (no auth, no edge function cost). To publish a new
 * version: drop the new PDF into `public/legal/v2/`, bump `version` here,
 * and update `effectiveDate`. Older versions stay on disk for audit history.
 */
export interface LegalDocument {
  slug: string;          // URL slug → /legal/:slug
  title: string;         // Human-friendly title
  description: string;   // One-line summary for the hub list
  file: string;          // Filename inside the version folder
  version: string;       // Current published version (e.g. "1.0")
  effectiveDate: string; // ISO date the current version took effect
}

// Current document set version. Bump when publishing a new revision pack.
export const LEGAL_VERSION_FOLDER = 'v1';

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: 'terms',
    title: 'Terms of Service',
    description: 'The contract between you and SoloSuccess Solutions when using the Academy.',
    file: 'Terms_of_Service.pdf',
    version: '1.0',
    effectiveDate: '2026-05-17',
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    description: 'What data we collect, why we collect it, and how to exercise your GDPR/CCPA rights.',
    file: 'Privacy_Policy.pdf',
    version: '1.0',
    effectiveDate: '2026-05-17',
  },
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    description: 'How cookies and similar tech are used across the platform.',
    file: 'Cookie_Policy.pdf',
    version: '1.0',
    effectiveDate: '2026-05-17',
  },
  {
    slug: 'refund',
    title: 'Refund Policy',
    description: '14-day money-back guarantee — no questions asked.',
    file: 'Refund_Policy.pdf',
    version: '1.0',
    effectiveDate: '2026-05-17',
  },
  {
    slug: 'acceptable-use',
    title: 'Acceptable Use Policy',
    description: 'Conduct rules for the Academy, community, and AI tooling.',
    file: 'Acceptable_Use_Policy.pdf',
    version: '1.0',
    effectiveDate: '2026-05-17',
  },
  {
    slug: 'disclaimer',
    title: 'Disclaimer',
    description: 'Earnings, educational, and AI-output disclaimers.',
    file: 'Disclaimer.pdf',
    version: '1.0',
    effectiveDate: '2026-05-17',
  },
  {
    slug: 'dmca',
    title: 'DMCA Policy',
    description: 'How to report copyright infringement and submit counter-notices.',
    file: 'DMCA_Policy.pdf',
    version: '1.0',
    effectiveDate: '2026-05-17',
  },
  {
    slug: 'affiliate-disclosure',
    title: 'Affiliate Disclosure',
    description: 'FTC-compliant disclosure for affiliate links and partnerships.',
    file: 'Affiliate_Disclosure.pdf',
    version: '1.0',
    effectiveDate: '2026-05-17',
  },
  {
    slug: 'subprocessors',
    title: 'Subprocessor List',
    description: 'Third-party services that process platform or student data.',
    file: 'Subprocessor_List.pdf',
    version: '1.0',
    effectiveDate: '2026-05-17',
  },
  {
    slug: 'certificate-verification',
    title: 'Certificate Verification Policy',
    description: 'How SoloSuccess Academy issues, verifies, and revokes certificates of completion.',
    file: 'Certificate_Verification_Policy.pdf',
    version: '1.0',
    effectiveDate: '2026-05-17',
  },
];

export function getLegalDocBySlug(slug: string): LegalDocument | undefined {
  return LEGAL_DOCUMENTS.find((d) => d.slug === slug);
}

export function getLegalDocUrl(doc: LegalDocument): string {
  return `/legal/${LEGAL_VERSION_FOLDER}/${doc.file}`;
}