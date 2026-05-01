/**
 * @file lifecycle-day7-resume.tsx — Day 7 inactivity resume nudge
 *
 * Sent once per (user, course) when a student has been inactive for 7+ days
 * and the course isn't complete. Deep-links to the next incomplete lesson.
 */
/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'SoloSuccess Academy'
const SITE_URL = 'https://solosuccessacademy.cloud'

interface ResumeProps {
  studentName?: string
  courseTitle?: string
  nextLessonTitle?: string
  resumeUrl?: string
  daysInactive?: number
}

const Day7Resume = ({
  studentName,
  courseTitle = 'your course',
  nextLessonTitle,
  resumeUrl = `${SITE_URL}/dashboard`,
  daysInactive,
}: ResumeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Pick up where you left off in {courseTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>🚀 SOLOSUCCESS ACADEMY</Text>
        </Section>

        <Heading style={h1}>
          {studentName ? `${studentName}, your spot is saved` : 'Your spot is saved'}
        </Heading>

        <Text style={text}>
          {daysInactive
            ? `It's been ${daysInactive} days since you last logged in to ${courseTitle}.`
            : `It's been a while since you last logged in to ${courseTitle}.`}{' '}
          That&apos;s totally fine — life happens. Your progress is exactly where you left it.
        </Text>

        {nextLessonTitle ? (
          <Section style={resumeBox}>
            <Text style={resumeLabel}>NEXT UP</Text>
            <Text style={resumeTitle}>{nextLessonTitle}</Text>
            <Text style={resumeMeta}>in {courseTitle}</Text>
          </Section>
        ) : null}

        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button style={cta} href={resumeUrl}>
            Resume Where You Left Off →
          </Button>
        </Section>

        <Text style={text}>
          15 minutes today is enough to keep momentum. You don&apos;t need to do
          a marathon session — just one lesson.
        </Text>

        <Hr style={divider} />

        <Text style={footer}>
          We&apos;ll be here when you&apos;re ready,<br />
          — The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Day7Resume,
  subject: (data: Record<string, any>) =>
    data?.courseTitle
      ? `Pick up where you left off in ${data.courseTitle}`
      : 'Pick up where you left off',
  displayName: 'Lifecycle: Day-7 resume',
  previewData: {
    studentName: 'Jordan',
    courseTitle: 'Course 01 — Mindset & Foundations',
    nextLessonTitle: 'Lesson 4: Building Your Founder Identity',
    resumeUrl: `${SITE_URL}/courses`,
    daysInactive: 9,
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
const resumeBox = {
  backgroundColor: 'hsl(270, 30%, 98%)',
  border: '1px solid hsl(270, 20%, 90%)',
  borderRadius: '8px',
  padding: '18px 22px',
  margin: '24px 0',
}
const resumeLabel = {
  fontSize: '11px', fontWeight: 'bold' as const, letterSpacing: '2px',
  color: 'hsl(270, 50%, 55%)', margin: '0 0 6px',
}
const resumeTitle = {
  fontSize: '17px', fontWeight: 'bold' as const,
  color: 'hsl(270, 30%, 15%)', margin: '0 0 4px',
}
const resumeMeta = {
  fontSize: '13px', color: 'hsl(270, 10%, 50%)', margin: 0,
}
const cta = {
  backgroundColor: 'hsl(270, 50%, 55%)', color: '#ffffff',
  padding: '12px 28px', borderRadius: '8px',
  fontWeight: 'bold' as const, fontSize: '15px',
  textDecoration: 'none', display: 'inline-block' as const,
}
const divider = { borderColor: 'hsl(270, 15%, 88%)', margin: '24px 0' }
const footer = {
  fontSize: '13px', color: 'hsl(270, 10%, 55%)', margin: '0', lineHeight: '1.5',
}