/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for SoloSuccess Academy</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>SOLOSUCCESS ACADEMY</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Confirm your email change 📧</Heading>
          <Text style={text}>
            You requested to change your email address from{' '}
            <Link href={`mailto:${email}`} style={link}>
              {email}
            </Link>{' '}
            to{' '}
            <Link href={`mailto:${newEmail}`} style={link}>
              {newEmail}
            </Link>
            .
          </Text>
          <Text style={text}>
            Click the button below to confirm this change:
          </Text>
          <Button style={button} href={confirmationUrl}>
            Confirm Email Change
          </Button>
          <Hr style={hr} />
          <Text style={footer}>
            If you didn't request this change, please secure your account immediately.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { maxWidth: '520px', margin: '0 auto' }
const header = {
  backgroundColor: 'hsl(270, 50%, 55%)',
  padding: '24px 25px',
  borderRadius: '12px 12px 0 0',
  textAlign: 'center' as const,
}
const logoText = {
  fontSize: '18px',
  fontWeight: '800' as const,
  color: '#ffffff',
  letterSpacing: '2px',
  margin: '0',
}
const content = { padding: '30px 25px 20px' }
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
  margin: '0 0 20px',
}
const link = { color: 'hsl(270, 50%, 55%)', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(270, 50%, 55%)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block' as const,
}
const hr = { borderColor: 'hsl(270, 15%, 85%)', margin: '28px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
