import { Resend } from 'resend'

// Initialize only if key exists, otherwise let it be undefined.
// We handle the check inside the function.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

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
  if (!resend) {
    console.log('MOCK EMAIL SEND:', { toEmail, eventName })
    return { success: true, messageId: 'mock-id' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Event CRM <events@yourdomain.com>', // TODO: Update with real verified domain
      to: [toEmail],
      subject: `Your Ticket for ${eventName}`,
      html: `
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
      `,
    })

    if (error) {
      console.error('Resend Error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (err) {
    console.error('Email Service Error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string,
  text?: string
}

export async function sendEmail({ to, subject, html, from, text }: SendEmailParams) {
  if (!resend) {
    console.log('MOCK EMAIL SEND:', { to, subject })
    return { success: true, messageId: 'mock-id' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: from || 'Event CRM <events@yourdomain.com>',
      to: [to],
      subject: subject,
      html: html,
      text: text,
    })

    if (error) {
      console.error('Resend Error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }

  } catch (err) {
    console.error('Email Service Error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
