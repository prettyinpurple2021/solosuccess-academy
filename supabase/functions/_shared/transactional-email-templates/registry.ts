/**
 * @file registry.ts — Transactional Email Template Registry
 *
 * Maps template names to their React Email components.
 * The send-transactional-email Edge Function imports this to look up templates.
 */
/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as contactConfirmation } from './contact-confirmation.tsx'
import { template as purchaseReceipt } from './purchase-receipt.tsx'
import { template as welcome } from './welcome.tsx'
import { template as lifecycleDay3Nudge } from './lifecycle-day3-nudge.tsx'
import { template as lifecycleDay7Resume } from './lifecycle-day7-resume.tsx'
import { template as dripDay1Welcome } from './drip-day1-welcome.tsx'
import { template as dripDay7Value } from './drip-day7-value.tsx'
import { template as dripDay14Final } from './drip-day14-final.tsx'
import { template as courseCompletionUpsell } from './course-completion-upsell.tsx'
import { template as webhookHealthAlert } from './webhook-health-alert.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'contact-confirmation': contactConfirmation,
  'purchase-receipt': purchaseReceipt,
  'welcome': welcome,
  'lifecycle-day3-nudge': lifecycleDay3Nudge,
  'lifecycle-day7-resume': lifecycleDay7Resume,
  'drip-day1-welcome': dripDay1Welcome,
  'drip-day7-value': dripDay7Value,
  'drip-day14-final': dripDay14Final,
  'course-completion-upsell': courseCompletionUpsell,
  'webhook-health-alert': webhookHealthAlert,
}
