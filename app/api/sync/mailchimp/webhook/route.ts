import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/*
  MAILCHIMP WEBHOOK HANDLER
  
  URL: https://yourapp.vercel.app/api/sync/mailchimp/webhook
  Secret: Pass as query param ?secret=XYZ or check headers depending on config.
*/

export async function POST(req: NextRequest) {
    try {
        // Parse Form Data (Mailchimp sends x-www-form-urlencoded)
        const formData = await req.formData()
        const type = formData.get('type')
        const firedAt = formData.get('data[merges][EMAIL]') // Example structure varies by event type directly on data[email] usually
        const email = formData.get('data[email]')

        if (!type || !email) {
            // Be nice to ping/verification requests
            return NextResponse.json({ received: true })
        }

        console.log(`Mailchimp Webhook: ${type} for ${email}`)
        const supabase = createAdminClient()

        if (type === 'unsubscribe' || type === 'cleaned') {
            // Mark as unsubscribed in CRM
            await supabase.from('contacts').update({ unsubscribed: true }).eq('email', String(email))

            // Log
            await supabase.from('sync_logs').insert({
                service: 'mailchimp',
                operation: 'webhook_unsubscribe',
                status: 'success',
                error_message: `Marked unsubscribed via webhook for ${email}`
            })
        }
        else if (type === 'upemail') {
            // Email Changed
            const oldEmail = formData.get('data[old_email]')
            const newEmail = formData.get('data[new_email]')

            if (oldEmail && newEmail) {
                await supabase.from('contacts').update({ email: String(newEmail) }).eq('email', String(oldEmail))
            }
        }

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('Webhook Error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// Mailchimp sends a GET verification sometimes
export async function GET(req: NextRequest) {
    return NextResponse.json({ status: 'ok' })
}
