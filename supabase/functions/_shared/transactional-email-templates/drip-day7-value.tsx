/**
 * @file drip-day7-value.tsx — Day 7 value email for non-buyers
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

const Day7Value = ({ studentName, catalogUrl = `${SITE_URL}/courses` }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>The 3 things solo founders get wrong (and how to fix them)</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Text style={logoText}>🚀 SOLOSUCCESS ACADEMY</Text></Section>
        <Heading style={h1}>{studentName ? `${studentName},` : 'Hey,'} a quick lesson on the house</Heading>
        <Text style={text}>Most solo founders we meet get stuck on the same three traps:</Text>
        <Text style={text}>
          <strong>1. Building before validating.</strong> Beautiful product, no buyers.<br />
          <strong>2. Selling time, not systems.</strong> Income capped by hours.<br />
          <strong>3. Doing everything alone.</strong> No frameworks, no leverage.
        </Text>
        <Text style={text}>
          Course 01 (<em>Mindset & Foundations</em>) tackles all three in your first week.
          If any of that sounded familiar, that's where to start.
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button style={cta} href={catalogUrl}>See Course 01 →</Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Day7Value,
  subject: 'The 3 things solo founders get wrong',
  displayName: 'Drip: Day 7 value (non-buyer)',
  previewData: { studentName: 'Jordan' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Arial', 'Helvetica', sans-serif" }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = { fontSize: '14px', fontWeight: 'bold' as const, letterSpacing: '3px', color: 'hsl(190, 95%, 45%)', margin: '0' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(220, 30%, 15%)', margin: '0 0 16px' }
const text = { fontSize: '15px', color: 'hsl(220, 10%, 35%)', lineHeight: '1.6', margin: '0 0 16px' }
const cta = { backgroundColor: 'hsl(190, 95%, 45%)', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontWeight: 'bold' as const, fontSize: '15px', textDecoration: 'none', display: 'inline-block' as const }
const divider = { borderColor: 'hsl(220, 15%, 88%)', margin: '24px 0' }
const footer = { fontSize: '13px', color: 'hsl(220, 10%, 55%)', margin: '0', lineHeight: '1.5' }