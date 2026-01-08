import { Resend } from 'resend'
import { MailtrapClient } from 'mailtrap'
import nodemailer from 'nodemailer'

// Initialize on first use to ensure env vars are loaded
let resendInstance: Resend | null = null
let mailtrapInstance: MailtrapClient | null = null
let smtpTransport: nodemailer.Transporter | null = null

function getResendClient() {
  if (resendInstance) return resendInstance
  if (process.env.RESEND_API_KEY) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
    return resendInstance
  }
  return null
}

function getMailtrapClient() {
  if (mailtrapInstance) return mailtrapInstance
  if (process.env.MAILTRAP_API_TOKEN) {
    mailtrapInstance = new MailtrapClient({ token: process.env.MAILTRAP_API_TOKEN })
    return mailtrapInstance
  }
  return null
}

function getSMTPTransport() {
  if (smtpTransport) return smtpTransport

  // Generic SMTP (Gmail/Outlook)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Robustness: remove spaces from password if present
    const cleanPass = process.env.SMTP_PASS.replace(/\s+/g, '')

    smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: cleanPass
      },
      debug: false,
      logger: false
    })
    return smtpTransport
  }

  // Fallback to Mailtrap SMTP
  if (process.env.MAILTRAP_SMTP_USER && process.env.MAILTRAP_SMTP_PASS) {
    smtpTransport = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_SMTP_USER,
        pass: process.env.MAILTRAP_SMTP_PASS
      }
    })
    return smtpTransport
  }
  return null
}

// Check which providers are available
function getAvailableProviders(): ('resend' | 'smtp' | 'mailtrap_api' | 'mock')[] {
  const providers: ('resend' | 'smtp' | 'mailtrap_api' | 'mock')[] = []

  if (process.env.RESEND_API_KEY) {
    providers.push('resend')
  }
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    providers.push('smtp')
  }
  if (process.env.MAILTRAP_SMTP_USER && process.env.MAILTRAP_SMTP_PASS) {
    providers.push('smtp')
  }
  if (process.env.MAILTRAP_API_TOKEN) {
    providers.push('mailtrap_api')
  }

  if (providers.length === 0) {
    providers.push('mock')
  }

  return providers
}

interface SendRegistrationParams {
  toEmail: string
  toName: string
  eventName: string
  eventDate: string
  eventLocation: string | null
  qrCodeDataURL: string
  attendanceId: string
}

export async function sendRegistrationConfirmation({
  toEmail,
  toName,
  eventName,
  eventDate,
  eventLocation,
  qrCodeDataURL,
}: SendRegistrationParams) {
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>You're going to ${eventName}!</h1>
      <p>Hi ${toName},</p>
      <p>This email confirms your registration.</p>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Event Details</h3>
        <p><strong>When:</strong> ${new Date(eventDate).toLocaleString()}</p>
        <p><strong>Where:</strong> ${eventLocation || 'TBD'}</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <p><strong>Show this QR code at check-in:</strong></p>
        <img src="${qrCodeDataURL}" alt="Your Ticket QR Code" style="width: 250px; height: 250px;" />
      </div>

      <p>See you there!</p>
    </div>
  `

  return sendEmail({
    to: toEmail,
    subject: `Your Ticket for ${eventName}`,
    html: emailHtml,
  })
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
  text?: string
  tags?: { name: string; value: string }[]
}

/**
 * Send a single email with automatic fallback.
 * Tries Resend first, falls back to SMTP (Gmail) if Resend fails.
 */
export async function sendEmail({ to, subject, html, from, tags }: SendEmailParams) {
  const providers = getAvailableProviders()
  console.log(`[Email] Available providers: ${providers.join(', ')}`)

  let lastError: string | undefined

  // Try Resend first
  if (providers.includes('resend')) {
    const resend = getResendClient()!
    try {
      console.log(`[Email] Attempting Resend for ${to}...`)
      const { data, error } = await resend.emails.send({
        from: from || process.env.NEXT_PUBLIC_FROM_EMAIL || 'Event CRM <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
        tags,
      })
      if (!error && data?.id) {
        console.log(`[Email] ✓ Resend success: ${data.id}`)
        return { success: true, messageId: data.id, provider: 'resend' }
      }
      lastError = error?.message || 'Unknown Resend error'
      console.log(`[Email] ✗ Resend failed: ${lastError}`)
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[Email] ✗ Resend exception: ${lastError}`)
    }
  }

  // Fallback to SMTP (Gmail)
  if (providers.includes('smtp')) {
    const transport = getSMTPTransport()
    if (transport) {
      try {
        console.log(`[Email] Falling back to SMTP for ${to}...`)
        const info = await transport.sendMail({
          from: from || process.env.SMTP_FROM || process.env.SMTP_USER || '"AR CRM" <noreply@example.com>',
          to: to,
          subject,
          html,
        })
        console.log(`[Email] ✓ SMTP success: ${info.messageId}`)
        return { success: true, messageId: info.messageId, provider: 'smtp' }
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Unknown error'
        console.error(`[Email] ✗ SMTP failed: ${lastError}`)
      }
    }
  }

  // Fallback to Mailtrap API
  if (providers.includes('mailtrap_api')) {
    const mailtrap = getMailtrapClient()
    if (mailtrap) {
      try {
        console.log(`[Email] Falling back to Mailtrap API for ${to}...`)
        const response = await mailtrap.send({
          from: { email: 'hello@demomailtrap.co', name: from || 'AR CRM' },
          to: [{ email: to }],
          subject,
          html,
        })
        console.log(`[Email] ✓ Mailtrap API success`)
        return { success: true, messageId: (response as any).message_ids?.[0] || 'sent', provider: 'mailtrap' }
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Unknown error'
        console.error(`[Email] ✗ Mailtrap API failed: ${lastError}`)
      }
    }
  }

  // Mock fallback
  if (providers.includes('mock')) {
    console.log('[Email] MOCK EMAIL SEND:', { to, subject })
    return { success: true, messageId: 'mock-id', provider: 'mock' }
  }

  // All providers failed
  console.error(`[Email] All providers failed for ${to}`)
  return { success: false, error: lastError || 'All email providers failed' }
}

export interface BatchEmailItem {
  to: string
  subject: string
  html: string
  from?: string
  tags?: { name: string; value: string }[]
}

export interface BatchResultItem {
  to: string
  status: 'sent' | 'failed'
  messageId?: string
  error?: string
  provider?: string
}

export interface BatchSendResult {
  items: BatchResultItem[]
}

/**
 * Send multiple emails in batch with automatic fallback.
 * Tries Resend batch first, falls back to SMTP for each email if needed.
 */
export async function sendBatchEmails(emails: BatchEmailItem[]): Promise<BatchSendResult> {
  const providers = getAvailableProviders()
  const resultItems: BatchResultItem[] = []

  console.log(`[Email] Batch send: ${emails.length} emails`)
  console.log(`[Email] Available providers: ${providers.join(', ')}`)

  if (emails.length === 0) {
    return { items: [] }
  }

  // Try Resend batch first
  if (providers.includes('resend')) {
    const resend = getResendClient()!

    if (emails.length <= 100) {
      try {
        const fromAddress = process.env.NEXT_PUBLIC_FROM_EMAIL || 'Event CRM <onboarding@resend.dev>'
        const emailPayloads = emails.map(email => ({
          from: email.from || fromAddress,
          to: [email.to],
          subject: email.subject,
          html: email.html,
          tags: email.tags,
        }))

        console.log(`[Email] Attempting Resend batch...`)
        const { data, error } = await resend.batch.send(emailPayloads)

        if (!error && data?.data) {
          console.log(`[Email] ✓ Resend batch success`)
          return {
            items: emails.map((e, i) => {
              const res = data.data?.[i]
              if (res?.id) {
                return { to: e.to, status: 'sent', messageId: res.id, provider: 'resend' }
              } else {
                return { to: e.to, status: 'failed', error: 'No ID returned', provider: 'resend' }
              }
            })
          }
        }

        console.log(`[Email] ✗ Resend batch failed: ${error?.message}`)
        // Don't return - fall through to individual fallback
      } catch (err) {
        console.error(`[Email] ✗ Resend batch exception:`, err)
        // Fall through to individual fallback
      }
    }
  }

  // Fallback: Send emails individually with fallback logic
  console.log(`[Email] Falling back to individual sends with provider fallback...`)

  for (const email of emails) {
    const result = await sendEmail({
      to: email.to,
      subject: email.subject,
      html: email.html,
      from: email.from,
      tags: email.tags,
    })

    if (result.success) {
      resultItems.push({
        to: email.to,
        status: 'sent',
        messageId: result.messageId,
        provider: (result as any).provider || 'unknown'
      })
    } else {
      resultItems.push({
        to: email.to,
        status: 'failed',
        error: result.error
      })
    }

    // Small delay between sends to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return { items: resultItems }
}
