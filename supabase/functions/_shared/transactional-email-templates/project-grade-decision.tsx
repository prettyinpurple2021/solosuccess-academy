/**
 * @file project-grade-decision.tsx — Capstone project grading result email
 *
 * Sent when an admin marks a submitted capstone project as approved
 * or needs_revision. One template with a status prop drives the copy.
 */
/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'SoloSuccess Academy'

interface Props {
  studentName?: string
  courseTitle?: string
  status?: 'approved' | 'needs_revision'
  score?: number
  notes?: string
  projectUrl?: string
}

const ProjectGradeDecisionEmail = ({
  studentName,
  courseTitle = 'your course',
  status = 'approved',
  score,
  notes,
  projectUrl = 'https://solosuccessacademy.app/dashboard',
}: Props) => {
  const approved = status === 'approved'
  const heading = approved ? 'Your project was approved!' : 'Revisions requested on your project'
  const preview = approved
    ? `Approved${typeof score === 'number' ? ` · ${score}/100` : ''} — ${courseTitle}`
    : `Please revise your ${courseTitle} project`

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>🚀 SOLOSUCCESS ACADEMY</Text>
          </Section>

          <Heading style={h1}>
            {studentName ? `Hi ${studentName},` : 'Hi there,'}
          </Heading>
          <Heading style={h2}>{heading}</Heading>

          <Text style={text}>
            Your capstone project for <strong>{courseTitle}</strong> has been reviewed
            {approved
              ? ' and approved. Great work!'
              : ' and needs a few improvements before it can be approved.'}
          </Text>

          {typeof score === 'number' && (
            <Section style={scoreBox}>
              <Text style={scoreLabel}>Grade</Text>
              <Text style={scoreValue}>{score}<span style={scoreSuffix}>/100</span></Text>
            </Section>
          )}

          {notes && notes.trim().length > 0 && (
            <>
              <Text style={notesLabel}>Instructor notes</Text>
              <Section style={notesBox}>
                <Text style={notesText}>{notes}</Text>
              </Section>
            </>
          )}

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button style={ctaButton} href={projectUrl}>
              {approved ? 'View your grade' : 'Open project & resubmit'}
            </Button>
          </Section>

          <Hr style={divider} />
          <Text style={footer}>
            Keep building.<br />
            The {SITE_NAME} Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ProjectGradeDecisionEmail,
  subject: (data: Record<string, any>) => {
    const course = (data?.courseTitle as string) || 'your course'
    return data?.status === 'needs_revision'
      ? `Revisions requested: ${course} project`
      : `Approved: your ${course} project`
  },
  displayName: 'Project grade decision',
  previewData: {
    studentName: 'Jane',
    courseTitle: 'Course 03 — Orchestration',
    status: 'approved',
    score: 92,
    notes: 'Strong execution — polish the pricing rationale for v2.',
  },
} satisfies TemplateEntry

/* ── Styles ── */
const main = { backgroundColor: '#ffffff', fontFamily: "'Arial', 'Helvetica', sans-serif" }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = {
  fontSize: '14px',
  fontWeight: 'bold' as const,
  letterSpacing: '3px',
  color: 'hsl(180, 90%, 40%)',
  margin: '0',
}
const h1 = { fontSize: '18px', color: 'hsl(220, 20%, 20%)', margin: '0 0 8px' }
const h2 = { fontSize: '22px', color: 'hsl(220, 30%, 12%)', margin: '0 0 16px' }
const text = { fontSize: '15px', color: 'hsl(220, 10%, 35%)', lineHeight: '1.6', margin: '0 0 16px' }
const scoreBox = {
  backgroundColor: 'hsl(180, 60%, 96%)',
  border: '1px solid hsl(180, 60%, 80%)',
  borderRadius: '8px',
  padding: '16px 20px',
  textAlign: 'center' as const,
  margin: '16px 0',
}
const scoreLabel = { fontSize: '11px', letterSpacing: '2px', color: 'hsl(180, 30%, 30%)', margin: '0 0 4px', textTransform: 'uppercase' as const }
const scoreValue = { fontSize: '32px', fontWeight: 'bold' as const, color: 'hsl(180, 90%, 30%)', margin: '0' }
const scoreSuffix = { fontSize: '14px', color: 'hsl(180, 30%, 40%)', fontWeight: 'normal' as const }
const notesLabel = { fontSize: '12px', letterSpacing: '1px', color: 'hsl(220, 15%, 50%)', textTransform: 'uppercase' as const, margin: '16px 0 6px' }
const notesBox = {
  backgroundColor: 'hsl(220, 15%, 97%)',
  border: '1px solid hsl(220, 15%, 88%)',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '0 0 8px',
}
const notesText = { fontSize: '14px', color: 'hsl(220, 15%, 25%)', lineHeight: '1.6', margin: '0', whiteSpace: 'pre-wrap' as const }
const ctaButton = {
  backgroundColor: 'hsl(180, 90%, 35%)',
  color: '#ffffff',
  padding: '12px 22px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
}
const divider = { borderColor: 'hsl(220, 15%, 88%)', margin: '24px 0' }
const footer = { fontSize: '13px', color: 'hsl(220, 10%, 50%)', margin: '0', lineHeight: '1.5' }