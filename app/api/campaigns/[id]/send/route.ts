import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email-service'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = createAdminClient()

        // 1. Validate Campaign
        const { data: campaign, error: campaignError } = await supabase
            .from('email_campaigns')
            .select('*')
            .eq('id', id)
            .single()

        if (campaignError || !campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        if (campaign.status !== 'draft' && campaign.status !== 'testing') {
            return NextResponse.json({ error: `Campaign status is ${campaign.status}, cannot send.` }, { status: 400 })
        }

        // 2. Fetch Audience (All Contacts for now)
        const { data: contacts, error: contactsError } = await supabase
            .from('contacts')
            .select('id, email, first_name, last_name')
            .eq('unsubscribed', false)

        if (contactsError) throw contactsError
        if (!contacts || contacts.length === 0) {
            return NextResponse.json({ error: 'No contacts found to send to.' }, { status: 400 })
        }

        // 3. Update Status to 'sending' (or 'sent' immediately since we process in-band for MVP)
        // NOTE: For thousands of emails, we'd offload to a queue (Inngest/BullMQ).
        // For MVP (Day 4), we'll stream/batch process in the function or just process small list.
        // Let's assume < 100 contacts for now and process in loop.

        let sentCount = 0
        let failCount = 0
        const errors = []

        // 4. Send Loop (Simulated Batching)
        for (const contact of contacts) {
            try {
                // Personalize (Basic Merge Tags)
                let personalizedBody = campaign.body_html || ''
                personalizedBody = personalizedBody
                    .replace(/{{first_name}}/g, contact.first_name || '')
                    .replace(/{{last_name}}/g, contact.last_name || '')
                    .replace(/{{email}}/g, contact.email || '')

                // Send (using existing email-service wrapper)
                await sendEmail({
                    to: contact.email,
                    subject: campaign.subject,
                    html: personalizedBody,
                    // from: campaign.from_email (we might need to update email-service to support custom from)
                })

                // Log Event
                // In a real high-throughput system, we'd batch these inserts too.
                await supabase.from('email_events').insert({
                    campaign_id: campaign.id,
                    contact_id: contact.id,
                    event_type: 'sent',
                    timestamp: new Date().toISOString()
                })

                sentCount++
            } catch (err) {
                console.error(`Failed to send to ${contact.email}`, err)
                failCount++
                errors.push({ email: contact.email, error: String(err) })
            }

            // Throttle (50ms) to avoid rate limits
            await new Promise(r => setTimeout(r, 50))
        }

        // 5. Update Campaign Stats
        await supabase
            .from('email_campaigns')
            .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
                total_sent: sentCount
            })
            .eq('id', campaign.id)

        return NextResponse.json({
            success: true,
            total: contacts.length,
            sent: sentCount,
            failed: failCount
        })

    } catch (err) {
        console.error('Send Error:', err)
        return NextResponse.json({ error: 'Failed to execute send' }, { status: 500 })
    }
}
