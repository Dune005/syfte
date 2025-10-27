import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const MAIL_FROM = process.env.MAIL_FROM || `no-reply@${process.env.APP_URL?.replace(/^https?:\/\//, '') || 'localhost'}`
const APP_URL = process.env.APP_URL || 'http://localhost:3200'
// Optional header for providers like Postmark (X-PM-Message-Stream)
const SMTP_EXTRA_HEADER = process.env.SMTP_EXTRA_HEADER || process.env.POSTMARK_MESSAGE_STREAM

let transporter: nodemailer.Transporter | null = null

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  const isSecurePort = SMTP_PORT === 465

  // By default: secure (SMTPS) on 465, otherwise use STARTTLS (requireTLS=true)
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: isSecurePort,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    // For providers like Postmark use STARTTLS on 587/2525. requireTLS forces upgrade.
    requireTLS: !isSecurePort,
    // Allow opting out of strict cert verification (useful in some corporate networks).
    tls: {
      // By default we verify server certificate; set SMTP_REJECT_UNAUTHORIZED=false to disable (not recommended in production)
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false'
    },
    // small timeouts to fail fast in dev
    greetingTimeout: 10_000,
    connectionTimeout: 10_000
  })
  // Attempt to verify connection configuration early and log result
  transporter.verify().then(() => {
    // eslint-disable-next-line no-console
    console.log('SMTP transporter verified')
  }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('SMTP transporter verification failed:', err)
  })
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`
  const subject = 'Syfte Passwort zurücksetzen'
  const text = `Du hast ein Zurücksetzen des Passworts angefordert. Verwende diesen Link, um dein Passwort zurückzusetzen: ${resetUrl}\n\nWenn du das nicht angefordert hast, ignoriere diese E-Mail.`
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #1E232C;">
      <h2>Passwort zurücksetzen</h2>
      <p>Hallo,</p>
      <p>Du hast ein Zurücksetzen deines Syfte-Passworts angefordert. Klicke auf den Button unten, um ein neues Passwort zu setzen. Der Link ist 24 Stunden gültig.</p>
      <p style="text-align:center; margin: 24px 0;"><a href="${resetUrl}" style="background:#35C2C1;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Passwort zurücksetzen</a></p>
      <p>Alternativ kannst du diesen Link kopieren und in deinen Browser einfügen:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <hr />
      <p style="font-size:12px;color:#6A707C;">Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>
    </div>
  `

  if (!transporter) {
    // In development or when SMTP is not configured, log the reset URL
    // so developers can copy it from logs.
    // This keeps behavior predictable when no SMTP is available.
    // eslint-disable-next-line no-console
    console.log(`(No SMTP) Password reset for ${to}: ${resetUrl}`)
    return
  }

  try {
    const mailOptions: any = {
      from: MAIL_FROM,
      to,
      subject,
      text,
      html
    }

    // If a special Postmark stream or other header is specified, add it
    if (SMTP_EXTRA_HEADER) {
      // if value looks like "key:value" split, otherwise assume Postmark stream
      if (SMTP_EXTRA_HEADER.includes(':')) {
        const [k, v] = SMTP_EXTRA_HEADER.split(':')
        mailOptions.headers = { [k.trim()]: v.trim() }
      } else {
        mailOptions.headers = { 'X-PM-Message-Stream': SMTP_EXTRA_HEADER }
      }
    }

    await transporter.sendMail(mailOptions)
  } catch (err) {
    // If sending fails, log the error but don't throw — we don't want
    // to reveal details to the client or break the password reset flow.
    // eslint-disable-next-line no-console
    console.error('Failed to send password reset email:', err)
  }
}
