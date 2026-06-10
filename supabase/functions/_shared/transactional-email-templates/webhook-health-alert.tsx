/**
 * @file webhook-health-alert.tsx — Admin alert email for webhook health issues.
 *
 * Sent to admins when the webhook monitor detects either:
 *  - Repeated webhook failures within a short window, or
 *  - A sudden drop in successful events vs. the baseline.
 */
/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'SoloSuccess Academy'

interface Props {
  alertType?: 'failures' | 'drop'
  summary?: string
  details?: string[]
  dashboardUrl?: string
}

const WebhookHealthAlertEmail = ({
  alertType = 'failures',
  summary = 'Webhook health issue detected.',
  details = [],
  dashboardUrl = 'https://solosuccessacademy.app/admin/webhook-health',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{summary}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>⚠️ SOLOSUCCESS · WEBHOOK ALERT</Text>
        </Section>

        <Heading style={h1}>
          {alertType === 'drop'
            ? 'Sudden drop in successful webhooks'
            : 'Repeated webhook failures detected'}
        </Heading>

        <Text style={text}>{summary}</Text>

        {details.length > 0 && (
          <Section style={detailsBox}>
            {details.map((line, i) => (
              <Text key={i} style={detailLine}>• {line}</Text>
            ))}
          </Section>
        )}

        <Section style={{ textAlign: 'center' as const, marginTop: '24px' }}>
          <Button href={dashboardUrl} style={button}>Open Webhook Health</Button>
        </Section>

        <Hr style={divider} />

        <Text style={footer}>
          You're receiving this because you're an admin of {SITE_NAME}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WebhookHealthAlertEmail,
  subject: (data: Record<string, any>) =>
    data?.alertType === 'drop'
      ? '⚠️ Sudden drop in successful webhooks'
      : '⚠️ Repeated webhook failures detected',
  displayName: 'Webhook health alert',
  previewData: {
    alertType: 'failures',
    summary: '4 Stripe webhook failures in the last 30 minutes.',
    details: [
      'checkout.session.completed — 3 failures',
      'charge.refunded — 1 failure',
      'Last error: signature verification failed',
    ],
    dashboardUrl: 'https://solosuccessacademy.app/admin/webhook-health',
  },
} satisfies TemplateEntry

/* ── Styles ── */
const main = { backgroundColor: '#ffffff', fontFamily: "'Arial', 'Helvetica', sans-serif" }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = {
  fontSize: '13px', fontWeight: 'bold' as const, letterSpacing: '3px',
  color: 'hsl(0, 70%, 50%)', margin: '0',
}
const h1 = {
  fontSize: '22px', fontWeight: 'bold' as const,
  color: 'hsl(270, 30%, 15%)', margin: '0 0 16px',
}
const text = { fontSize: '14px', color: 'hsl(270, 10%, 35%)', lineHeight: '1.6', margin: '0 0 12px' }
const detailsBox = {
  backgroundColor: 'hsl(0, 70%, 97%)',
  border: '1px solid hsl(0, 70%, 88%)',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '12px 0 4px',
}
const detailLine = { fontSize: '13px', color: 'hsl(0, 50%, 30%)', margin: '4px 0', lineHeight: '1.5' }
const button = {
  backgroundColor: 'hsl(190, 90%, 45%)',
  color: '#ffffff',
  padding: '12px 22px',
  borderRadius: '6px',
  fontWeight: 'bold' as const,
  fontSize: '14px',
  textDecoration: 'none',
  display: 'inline-block',
}
const divider = { borderColor: 'hsl(270, 15%, 85%)', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: 'hsl(270, 10%, 55%)', margin: '0', lineHeight: '1.5' }