/**
 * @file LegalDisclaimer.tsx — Shared "not legal advice" notice
 *
 * Rendered at the top of each legal page so users understand these
 * documents are templates tailored to SoloSuccess Academy and not a
 * substitute for jurisdiction-specific legal counsel.
 */
import { AlertTriangle } from 'lucide-react';

export function LegalDisclaimer() {
  return (
    <div
      role="note"
      className="mb-10 flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 p-4 text-sm"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <p className="text-foreground/80 leading-relaxed">
        This document is provided in plain English and reflects how
        SoloSuccess Academy operates. It is not legal advice. If you require
        legal counsel for your specific situation, please consult a licensed
        attorney in your jurisdiction.
      </p>
    </div>
  );
}
