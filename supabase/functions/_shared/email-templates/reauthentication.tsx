/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code for SoloSuccess Academy</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>SOLOSUCCESS ACADEMY</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Confirm your identity 🔑</Heading>
          <Text style={text}>Use the code below to verify your identity:</Text>
          <Text style={codeStyle}>{token}</Text>
          <Hr style={hr} />
          <Text style={footer}>
            This code will expire shortly. If you didn't request this, you can
            safely ignore this email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: 'hsl(270, 50%, 55%)',
  textAlign: 'center' as const,
  letterSpacing: '6px',
  padding: '16px',
  backgroundColor: 'hsl(270, 20%, 96%)',
  borderRadius: '12px',
  margin: '0 0 20px',
}
const hr = { borderColor: 'hsl(270, 15%, 85%)', margin: '28px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
