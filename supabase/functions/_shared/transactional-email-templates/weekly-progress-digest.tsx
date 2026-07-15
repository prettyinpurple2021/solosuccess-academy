/**
 * @file weekly-progress-digest.tsx — Monday weekly progress digest
 *
 * Recap of the previous 7 days: XP earned, lessons completed, current
 * streak, and a clear "resume here" CTA to the next unfinished lesson.
 */
/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
  Row, Column,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'SoloSuccess Academy'
const SITE_URL = 'https://solosuccessacademy.app'

interface DigestProps {
  studentName?: string
  xpEarned?: number
  lessonsCompleted?: number
  currentStreak?: number
  totalXp?: number
  nextLessonTitle?: string
  nextCourseTitle?: string
  resumeUrl?: string
  weekLabel?: string
}

const Digest = ({
  studentName,
  xpEarned = 0,
  lessonsCompleted = 0,
  currentStreak = 0,
  totalXp = 0,
  nextLessonTitle,
  nextCourseTitle,
  resumeUrl = `${SITE_URL}/dashboard`,
  weekLabel,
}: DigestProps) => {
  const hadActivity = xpEarned > 0 || lessonsCompleted > 0
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {hadActivity
          ? `+${xpEarned} XP · ${lessonsCompleted} lessons this week`
          : 'Your week ahead at SoloSuccess Academy'}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>🚀 SOLOSUCCESS ACADEMY</Text>
          </Section>

          <Heading style={h1}>
            {studentName ? `${studentName}, your weekly recap` : 'Your weekly recap'}
          </Heading>
          {weekLabel ? <Text style={subhead}>{weekLabel}</Text> : null}

          <Section style={statsBox}>
            <Row>
              <Column style={statCol}>
                <Text style={statValue}>+{xpEarned}</Text>
                <Text style={statLabel}>XP EARNED</Text>
              </Column>
              <Column style={statCol}>
                <Text style={statValue}>{lessonsCompleted}</Text>
                <Text style={statLabel}>LESSONS DONE</Text>
              </Column>
              <Column style={statCol}>
                <Text style={statValue}>{currentStreak}🔥</Text>
                <Text style={statLabel}>DAY STREAK</Text>
              </Column>
            </Row>
          </Section>

          <Text style={text}>
            {hadActivity
              ? `Nice work — you added ${xpEarned} XP to your total of ${totalXp}. Momentum compounds; one more session this week keeps the streak alive.`
              : `You didn't log activity last week — that's okay. The fastest way back in is one short lesson today. Your progress is exactly where you left it.`}
          </Text>

          {nextLessonTitle ? (
            <Section style={resumeBox}>
              <Text style={resumeLabel}>UP NEXT</Text>
              <Text style={resumeTitle}>{nextLessonTitle}</Text>
              {nextCourseTitle ? (
                <Text style={resumeMeta}>in {nextCourseTitle}</Text>
              ) : null}
            </Section>
          ) : null}

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={cta} href={resumeUrl}>
              {nextLessonTitle ? 'Resume Learning →' : 'Open Dashboard →'}
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            Keep going — every 15 minutes counts,<br />
            — The {SITE_NAME} Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Digest,
  subject: (data: Record<string, any>) => {
    const xp = Number(data?.xpEarned ?? 0)
    const lessons = Number(data?.lessonsCompleted ?? 0)
    if (xp > 0 || lessons > 0) {
      return `Your week: +${xp} XP · ${lessons} lesson${lessons === 1 ? '' : 's'}`
    }
    return 'Your weekly recap is ready'
  },
  displayName: 'Weekly progress digest',
  previewData: {
    studentName: 'Jordan',
    xpEarned: 240,
    lessonsCompleted: 3,
    currentStreak: 5,
    totalXp: 1820,
    nextLessonTitle: 'Lesson 4: Building Your Founder Identity',
    nextCourseTitle: 'Course 01 — Mindset & Foundations',
    resumeUrl: `${SITE_URL}/dashboard`,
    weekLabel: 'Week of Jul 8 – Jul 14',
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
  color: 'hsl(270, 30%, 15%)', margin: '0 0 4px',
}
const subhead = {
  fontSize: '13px', color: 'hsl(270, 10%, 50%)', margin: '0 0 20px',
}
const text = {
  fontSize: '15px', color: 'hsl(270, 10%, 35%)', lineHeight: '1.6', margin: '0 0 16px',
}
const statsBox = {
  backgroundColor: 'hsl(270, 30%, 98%)',
  border: '1px solid hsl(270, 20%, 90%)',
  borderRadius: '8px',
  padding: '20px 12px',
  margin: '20px 0 24px',
}
const statCol = { textAlign: 'center' as const, padding: '0 6px' }
const statValue = {
  fontSize: '22px', fontWeight: 'bold' as const,
  color: 'hsl(270, 50%, 45%)', margin: '0 0 4px',
}
const statLabel = {
  fontSize: '10px', fontWeight: 'bold' as const, letterSpacing: '1.5px',
  color: 'hsl(270, 10%, 50%)', margin: 0,
}
const resumeBox = {
  backgroundColor: 'hsl(270, 30%, 98%)',
  border: '1px solid hsl(270, 20%, 90%)',
  borderRadius: '8px',
  padding: '18px 22px',
  margin: '16px 0',
}
const resumeLabel = {
  fontSize: '11px', fontWeight: 'bold' as const, letterSpacing: '2px',
  color: 'hsl(270, 50%, 55%)', margin: '0 0 6px',
}
const resumeTitle = {
  fontSize: '17px', fontWeight: 'bold' as const,
  color: 'hsl(270, 30%, 15%)', margin: '0 0 4px',
}
const resumeMeta = { fontSize: '13px', color: 'hsl(270, 10%, 50%)', margin: 0 }
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