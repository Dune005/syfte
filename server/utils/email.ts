import { ServerClient } from 'postmark'

const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY
const MAIL_FROM = process.env.MAIL_FROM || 'info@syfte.ch'
const APP_URL = process.env.APP_URL || 'http://localhost:3200'

let postmarkClient: ServerClient | null = null

if (POSTMARK_API_KEY) {
  postmarkClient = new ServerClient(POSTMARK_API_KEY)
  // eslint-disable-next-line no-console
  console.log('Postmark client initialized')
} else {
  // eslint-disable-next-line no-console
  console.warn(' POSTMARK_API_KEY not set - emails will be logged to console only')
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`
  const subject = 'Syfte Passwort zurücksetzen'
  const textBody = `Du hast ein Zurücksetzen des Passworts angefordert. Verwende diesen Link, um dein Passwort zurückzusetzen: ${resetUrl}\n\nWenn du das nicht angefordert hast, ignoriere diese E-Mail.`
  const htmlBody = `
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

  if (!postmarkClient) {
    // In development or when Postmark API key is not configured, log the reset URL
    // so developers can copy it from logs.
    // eslint-disable-next-line no-console
    console.log(`(No Postmark API Key) Password reset for ${to}: ${resetUrl}`)
    return
  }

  try {
    await postmarkClient.sendEmail({
      From: MAIL_FROM,
      To: to,
      Subject: subject,
      TextBody: textBody,
      HtmlBody: htmlBody,
      MessageStream: 'outbound'
    })
    // eslint-disable-next-line no-console
    console.log(`Password reset email sent to ${to}`)
  } catch (err) {
    // If sending fails, log the error but don't throw — we don't want
    // to reveal details to the client or break the password reset flow.
    // eslint-disable-next-line no-console
    console.error('Failed to send password reset email:', err)
  }
}
