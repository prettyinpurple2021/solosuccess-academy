/**
 * @file contact-confirmation.tsx — Contact Form Confirmation Email
 *
 * Sent to visitors after they submit the contact form.
 * Branded to match SoloSuccess Academy's purple theme.
 */
/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "SoloSuccess Academy"

interface ContactConfirmationProps {
  name?: string
}

const ContactConfirmationEmail = ({ name }: ContactConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Thanks for reaching out to {SITE_NAME}!</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Text style={logoText}>🚀 SOLOSUCCESS ACADEMY</Text>
        </Section>

        <Heading style={h1}>
          {name ? `Thanks, ${name}!` : 'Thanks for reaching out!'}
        </Heading>

        <Text style={text}>
          We've received your message and our team will get back to you as soon
          as possible — usually within 24–48 hours.
        </Text>

        <Text style={text}>
          In the meantime, feel free to explore our courses or check our FAQ for
          quick answers.
        </Text>

        <Hr style={divider} />

        <Text style={footer}>
          Best regards,<br />
          The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactConfirmationEmail,
  subject: 'We received your message!',
  displayName: 'Contact confirmation',
  previewData: { name: 'Jane' },
} satisfies TemplateEntry

/* ── Styles ── */
const main = { backgroundColor: '#ffffff', fontFamily: "'Arial', 'Helvetica', sans-serif" }
const container = { padding: '32px 24px', maxWidth: '520px', margin: '0 auto' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = {
  fontSize: '14px',
  fontWeight: 'bold' as const,
  letterSpacing: '3px',
  color: 'hsl(270, 50%, 55%)',
  margin: '0',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(270, 30%, 15%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(270, 10%, 45%)',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const divider = { borderColor: 'hsl(270, 15%, 85%)', margin: '24px 0' }
const footer = {
  fontSize: '13px',
  color: 'hsl(270, 10%, 55%)',
  margin: '0',
  lineHeight: '1.5',
}
