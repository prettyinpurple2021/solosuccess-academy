/**
 * @file lifecycle-day3-nudge.tsx — Day 3 post-purchase nudge
 *
 * Sent once when a student has owned a course for 3+ days but hasn't
 * completed any lessons. Goal: get them into Lesson 1 today.
 */
/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'SoloSuccess Academy'
const SITE_URL = 'https://solosuccessacademy.cloud'

interface NudgeProps {
  studentName?: string
  courseTitle?: string
  resumeUrl?: string
}

const Day3Nudge = ({
  studentName,
  courseTitle = 'your course',
  resumeUrl = `${SITE_URL}/dashboard`,
}: NudgeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your first lesson in {courseTitle} is waiting</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>🚀 SOLOSUCCESS ACADEMY</Text>
        </Section>

        <Heading style={h1}>
          {studentName ? `Hey ${studentName} —` : 'Quick check-in —'} ready to start?
        </Heading>

        <Text style={text}>
          You enrolled in <strong>{courseTitle}</strong> a few days ago, and your
          first lesson is still waiting.
        </Text>

        <Text style={text}>
          The hardest part of any course is opening Lesson 1. Once you do, the
          rest gets easier — that&apos;s genuinely how it works.
        </Text>

        <Section style={tipBox}>
          <Text style={tipText}>
            <strong>One small commit:</strong> 15 minutes today. That&apos;s it.
            You can pause anywhere — your progress is saved automatically.
          </Text>
        </Section>

        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button style={cta} href={resumeUrl}>
            Open Lesson 1 →
          </Button>
        </Section>

        <Hr style={divider} />

        <Text style={smallText}>
          Not what you needed? Our{' '}
          <a href={`${SITE_URL}/refund`} style={link}>14-day refund</a> is
          still active — just reply to this email and we&apos;ll handle it.
        </Text>

        <Text style={footer}>
          Cheering you on,<br />
          — The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Day3Nudge,
  subject: (data: Record<string, any>) =>
    data?.courseTitle
      ? `Your first lesson in ${data.courseTitle} is waiting`
      : 'Your first lesson is waiting',
  displayName: 'Lifecycle: Day-3 nudge',
  previewData: {
    studentName: 'Jordan',
    courseTitle: 'Course 01 — Mindset & Foundations',
    resumeUrl: `${SITE_URL}/dashboard`,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Arial', 'Helvetica', sans-serif" }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = {
  fontSize: '14px', fontWeight: 'bold' as const, letterSpacing: '3px',
  color: 'hsl(270, 50%, 55%)', margin: '0',
}
const h1 = {
  fontSize: '24px', fontWeight: 'bold' as const,
  color: 'hsl(270, 30%, 15%)', margin: '0 0 16px',
}
const text = {
  fontSize: '15px', color: 'hsl(270, 10%, 35%)', lineHeight: '1.6', margin: '0 0 16px',
}
const tipBox = {
  backgroundColor: 'hsl(270, 30%, 98%)',
  borderLeft: '3px solid hsl(270, 50%, 55%)',
  borderRadius: '4px',
  padding: '14px 18px',
  margin: '20px 0',
}
const tipText = {
  fontSize: '14px', color: 'hsl(270, 30%, 20%)', lineHeight: '1.6', margin: 0,
}
const cta = {
  backgroundColor: 'hsl(270, 50%, 55%)', color: '#ffffff',
  padding: '12px 28px', borderRadius: '8px',
  fontWeight: 'bold' as const, fontSize: '15px',
  textDecoration: 'none', display: 'inline-block' as const,
}
const divider = { borderColor: 'hsl(270, 15%, 88%)', margin: '24px 0' }
const smallText = {
  fontSize: '13px', color: 'hsl(270, 10%, 50%)', lineHeight: '1.6', margin: '0 0 12px',
}
const link = { color: 'hsl(270, 50%, 55%)', textDecoration: 'underline' }
const footer = {
  fontSize: '13px', color: 'hsl(270, 10%, 55%)', margin: '0', lineHeight: '1.5',
}