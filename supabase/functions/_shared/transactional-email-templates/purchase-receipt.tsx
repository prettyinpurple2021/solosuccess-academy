/**
 * @file purchase-receipt.tsx — Branded purchase receipt
 *
 * Sent immediately after a successful Stripe checkout (one-time payment).
 * Mirrors the academy's purple cyberpunk-EdTech aesthetic.
 */
/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "SoloSuccess Academy"
const SITE_URL = "https://solosuccessacademy.cloud"

interface PurchaseReceiptProps {
  studentName?: string
  courseTitle?: string
  amountFormatted?: string  // e.g. "$49.00"
  purchaseDate?: string     // e.g. "April 26, 2026"
  orderId?: string          // stripe checkout session id (truncated)
  courseUrl?: string        // deep link
}

const PurchaseReceiptEmail = ({
  studentName,
  courseTitle = 'your course',
  amountFormatted = '',
  purchaseDate = '',
  orderId = '',
  courseUrl = `${SITE_URL}/dashboard`,
}: PurchaseReceiptProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Thanks for your purchase — your receipt for {courseTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>🚀 SOLOSUCCESS ACADEMY</Text>
        </Section>

        <Heading style={h1}>
          {studentName ? `Welcome aboard, ${studentName}!` : 'Welcome aboard!'}
        </Heading>

        <Text style={text}>
          Your purchase is confirmed and your course access is active.
          Below is your receipt for your records.
        </Text>

        {/* Receipt block */}
        <Section style={receiptBox}>
          <Text style={receiptRow}>
            <strong style={receiptLabel}>Course:</strong>
            <span style={receiptValue}>{courseTitle}</span>
          </Text>
          {amountFormatted ? (
            <Text style={receiptRow}>
              <strong style={receiptLabel}>Amount:</strong>
              <span style={receiptValue}>{amountFormatted} USD</span>
            </Text>
          ) : null}
          {purchaseDate ? (
            <Text style={receiptRow}>
              <strong style={receiptLabel}>Date:</strong>
              <span style={receiptValue}>{purchaseDate}</span>
            </Text>
          ) : null}
          {orderId ? (
            <Text style={receiptRow}>
              <strong style={receiptLabel}>Order ID:</strong>
              <span style={{ ...receiptValue, fontFamily: 'monospace', fontSize: '12px' }}>
                {orderId}
              </span>
            </Text>
          ) : null}
        </Section>

        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button style={cta} href={courseUrl}>
            Start Learning →
          </Button>
        </Section>

        <Hr style={divider} />

        <Text style={smallText}>
          <strong>30-day money-back guarantee.</strong> Not happy with the course?
          Reply to this email or contact us within 30 days for a full refund (provided
          you haven&apos;t completed more than 50% of lessons).
        </Text>

        <Text style={smallText}>
          You can view all your purchases and download future receipts at{' '}
          <a href={`${SITE_URL}/billing`} style={link}>{SITE_URL}/billing</a>
        </Text>

        <Hr style={divider} />

        <Text style={footer}>
          Thanks for trusting us with your learning journey.<br />
          — The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PurchaseReceiptEmail,
  subject: (data: Record<string, any>) =>
    data?.courseTitle
      ? `Receipt for ${data.courseTitle} — SoloSuccess Academy`
      : 'Your SoloSuccess Academy receipt',
  displayName: 'Purchase receipt',
  previewData: {
    studentName: 'Jordan',
    courseTitle: 'Course 01 — Mindset & Foundations',
    amountFormatted: '$49.00',
    purchaseDate: 'April 26, 2026',
    orderId: 'cs_test_a1b2c3d4',
    courseUrl: `${SITE_URL}/dashboard`,
  },
} satisfies TemplateEntry

/* ── Styles (match the contact-confirmation aesthetic) ── */
const main = { backgroundColor: '#ffffff', fontFamily: "'Arial', 'Helvetica', sans-serif" }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = {
  fontSize: '14px',
  fontWeight: 'bold' as const,
  letterSpacing: '3px',
  color: 'hsl(270, 50%, 55%)',
  margin: '0',
}
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: 'hsl(270, 30%, 15%)',
  margin: '0 0 16px',
}
const text = {
  fontSize: '15px',
  color: 'hsl(270, 10%, 35%)',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const receiptBox = {
  backgroundColor: 'hsl(270, 30%, 98%)',
  border: '1px solid hsl(270, 20%, 90%)',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '24px 0',
}
const receiptRow = {
  fontSize: '14px',
  margin: '0 0 10px',
  display: 'block' as const,
}
const receiptLabel = {
  color: 'hsl(270, 10%, 45%)',
  display: 'inline-block' as const,
  width: '90px',
  fontWeight: '600' as const,
}
const receiptValue = {
  color: 'hsl(270, 30%, 15%)',
  fontWeight: '500' as const,
}
const cta = {
  backgroundColor: 'hsl(270, 50%, 55%)',
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: '8px',
  fontWeight: 'bold' as const,
  fontSize: '15px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}
const divider = { borderColor: 'hsl(270, 15%, 88%)', margin: '24px 0' }
const smallText = {
  fontSize: '13px',
  color: 'hsl(270, 10%, 50%)',
  lineHeight: '1.6',
  margin: '0 0 12px',
}
const link = { color: 'hsl(270, 50%, 55%)', textDecoration: 'underline' }
const footer = {
  fontSize: '13px',
  color: 'hsl(270, 10%, 55%)',
  margin: '0',
  lineHeight: '1.5',
}
