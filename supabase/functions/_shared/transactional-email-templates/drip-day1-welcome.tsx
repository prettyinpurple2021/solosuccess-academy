/**
 * @file drip-day1-welcome.tsx — Day 1 onboarding for non-buyers
 * Sent ~24h after signup if user has not purchased anything yet.
 */
/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'SoloSuccess Academy'
const SITE_URL = 'https://solosuccessacademy.cloud'

interface Props { studentName?: string; catalogUrl?: string }

const Day1Welcome = ({ studentName, catalogUrl = `${SITE_URL}/courses` }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your roadmap to going solo starts here</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Text style={logoText}>🚀 SOLOSUCCESS ACADEMY</Text></Section>
        <Heading style={h1}>{studentName ? `Welcome, ${studentName}.` : 'Welcome.'}</Heading>
        <Text style={text}>
          You signed up because something in you wants more freedom, more
          ownership, more of your own work. We built this academy for exactly that.
        </Text>
        <Text style={text}>
          Here's the path: 10 focused courses across <strong>Initialization,
          Orchestration, and Launch</strong>. Lifetime access. No subscriptions.
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button style={cta} href={catalogUrl}>Browse the catalog →</Button>
        </Section>
        <Hr style={divider} />
        <Text style={smallText}>
          Reply to this email anytime — a real human reads it.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Day1Welcome,
  subject: 'Your roadmap to going solo starts here',
  displayName: 'Drip: Day 1 welcome (non-buyer)',
  previewData: { studentName: 'Jordan', catalogUrl: `${SITE_URL}/courses` },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Arial', 'Helvetica', sans-serif" }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = { fontSize: '14px', fontWeight: 'bold' as const, letterSpacing: '3px', color: 'hsl(190, 95%, 45%)', margin: '0' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(220, 30%, 15%)', margin: '0 0 16px' }
const text = { fontSize: '15px', color: 'hsl(220, 10%, 35%)', lineHeight: '1.6', margin: '0 0 16px' }
const cta = { backgroundColor: 'hsl(190, 95%, 45%)', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontWeight: 'bold' as const, fontSize: '15px', textDecoration: 'none', display: 'inline-block' as const }
const divider = { borderColor: 'hsl(220, 15%, 88%)', margin: '24px 0' }
const smallText = { fontSize: '13px', color: 'hsl(220, 10%, 50%)', lineHeight: '1.6', margin: '0 0 12px' }
const footer = { fontSize: '13px', color: 'hsl(220, 10%, 55%)', margin: '0', lineHeight: '1.5' }