/**
 * @file welcome.tsx — Branded welcome email for new signups
 *
 * Sent once when a new student signs up. Sets expectations and gives them
 * three clear next steps: browse the catalog, start the free preview, get
 * help. Matches the purchase-receipt aesthetic.
 */
/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'SoloSuccess Academy'
const SITE_URL = 'https://solosuccessacademy.cloud'

interface WelcomeProps {
  studentName?: string
}

const WelcomeEmail = ({ studentName }: WelcomeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — here&apos;s how to get started</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>🚀 SOLOSUCCESS ACADEMY</Text>
        </Section>

        <Heading style={h1}>
          {studentName ? `Welcome, ${studentName}!` : 'Welcome aboard!'}
        </Heading>

        <Text style={text}>
          You just joined an academy built for solo founders, side-hustlers,
          and indie hackers who want to ship real businesses — not collect
          certificates.
        </Text>

        <Text style={text}>
          Your account is active. Here&apos;s how to get value in the next 5 minutes:
        </Text>

        <Section style={stepsBox}>
          <Text style={stepRow}>
            <strong style={stepNum}>1.</strong>
            <span style={stepText}>
              <strong>Browse the curriculum.</strong> 10 courses covering Initialization,
              Orchestration, and Launch — all lifetime access, no subscription.
            </span>
          </Text>
          <Text style={stepRow}>
            <strong style={stepNum}>2.</strong>
            <span style={stepText}>
              <strong>Start with Course 01 (free preview).</strong> Mindset and
              foundations — see exactly how the platform feels before you commit.
            </span>
          </Text>
          <Text style={stepRow}>
            <strong style={stepNum}>3.</strong>
            <span style={stepText}>
              <strong>Set a daily learning goal.</strong> Just 15 minutes a day
              compounds — the platform tracks your streak automatically.
            </span>
          </Text>
        </Section>

        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button style={cta} href={`${SITE_URL}/courses`}>
            Browse the Curriculum →
          </Button>
        </Section>

        <Hr style={divider} />

        <Text style={smallText}>
          <strong>Have a question?</strong> Reply to this email or visit our{' '}
          <a href={`${SITE_URL}/help`} style={link}>Help Center</a>. We answer
          every message personally.
        </Text>

        <Text style={smallText}>
          Every paid course comes with a <strong>14-day no-questions-asked refund</strong> —
          full details in our{' '}
          <a href={`${SITE_URL}/refund`} style={link}>refund policy</a>.
        </Text>

        <Hr style={divider} />

        <Text style={footer}>
          Glad you&apos;re here.<br />
          — The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to SoloSuccess Academy',
  displayName: 'Welcome (signup)',
  previewData: { studentName: 'Jordan' },
} satisfies TemplateEntry

/* ── Styles ── */
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
const stepsBox = {
  backgroundColor: 'hsl(270, 30%, 98%)',
  border: '1px solid hsl(270, 20%, 90%)',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '24px 0',
}
const stepRow = {
  fontSize: '14px',
  margin: '0 0 14px',
  display: 'block' as const,
  lineHeight: '1.6',
}
const stepNum = {
  color: 'hsl(270, 50%, 55%)',
  display: 'inline-block' as const,
  width: '22px',
  fontWeight: 'bold' as const,
  fontSize: '15px',
}
const stepText = { color: 'hsl(270, 30%, 20%)' }
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