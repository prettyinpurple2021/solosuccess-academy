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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to SoloSuccess Academy — verify your email to get started</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>SOLOSUCCESS ACADEMY</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Welcome aboard! 🚀</Heading>
          <Text style={text}>
            Thanks for signing up for{' '}
            <Link href={siteUrl} style={link}>
              <strong>SoloSuccess Academy</strong>
            </Link>
            ! You're one step away from starting your solo entrepreneur journey.
          </Text>
          <Text style={text}>
            Please confirm your email address (
            <Link href={`mailto:${recipient}`} style={link}>
              {recipient}
            </Link>
            ) by clicking the button below:
          </Text>
          <Button style={button} href={confirmationUrl}>
            Verify Email &amp; Get Started
          </Button>
          <Hr style={hr} />
          <Text style={footer}>
            If you didn't create an account, you can safely ignore this email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
