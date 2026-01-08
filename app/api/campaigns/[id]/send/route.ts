import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBatchEmails } from '@/lib/email-service'

// Get base URL from request headers (works correctly on Vercel)
function getBaseUrlFromRequest(req: NextRequest): string {
    const host = req.headers.get('host') || req.headers.get('x-forwarded-host')
    const protocol = req.headers.get('x-forwarded-proto') || 'https'

    if (host) {
        return `${protocol}://${host}`
    }

    // Fallback to env var with sanitization
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    try {
        if (!baseUrl.startsWith('http')) {
            baseUrl = `https://${baseUrl}`
        }
        const url = new URL(baseUrl)
        return url.origin
    } catch {
        return baseUrl.replace(/\/$/, '')
    }
}

// Generate tracking pixel URL
function getTrackingPixel(baseUrl: string, campaignId: string, contactId: string): string {
    return `<img src="${baseUrl}/api/track/open?cid=${campaignId}&uid=${contactId}" width="1" height="1" style="display:none;" alt="" />`
}

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
        const { data: allContacts, error: contactsError } = await supabase
            .from('contacts')
            .select('id, email, first_name, last_name')
            .eq('unsubscribed', false)

        if (contactsError) throw contactsError

        // Filter out any invalid email domains
        const contacts = (allContacts || []).filter(c => {
            const email = c.email?.toLowerCase() || ''

            // Skip invalid domains
            if (email.includes('@example.com') || email.includes('@test.com') || !email.includes('@')) {
                console.log('Skipping invalid email:', c.email)
                return false
            }

            return true
        })

        console.log('Sending to contacts:', contacts.map(c => c.email))

        if (!contacts || contacts.length === 0) {
            return NextResponse.json({ error: 'No valid contacts found to send to.' }, { status: 400 })
        }

        // Get base URL from request for tracking pixels
        const baseUrl = getBaseUrlFromRequest(req)
        console.log('[Send] Using base URL for tracking:', baseUrl)

        // 3. Prepare emails for batch sending
        const emailsToSend = contacts.map(contact => {
            // Personalize (Basic Merge Tags)
            let personalizedBody = campaign.body_html || '<p>No content provided.</p>'
            personalizedBody = personalizedBody
                .replace(/{{first_name}}/g, contact.first_name || '')
                .replace(/{{last_name}}/g, contact.last_name || '')
                .replace(/{{email}}/g, contact.email || '')

            // Add tracking pixel before closing body tag
            const trackingPixel = getTrackingPixel(baseUrl, campaign.id, contact.id)
            if (personalizedBody.includes('</body>')) {
                personalizedBody = personalizedBody.replace('</body>', `${trackingPixel}</body>`)
            } else {
                personalizedBody = `${personalizedBody}${trackingPixel}`
            }

            return {
                to: contact.email,
                subject: campaign.subject || 'No Subject',
                html: personalizedBody,
                tags: [{ name: 'campaign_id', value: campaign.id }]
            }
        })

        // 4. Send in batches of 100 (Resend limit)
        let sentCount = 0
        let failCount = 0
        const errors: { batch: number; error: string }[] = []
        const messageIds: string[] = []

        const BATCH_SIZE = 100
        const batches = []
        for (let i = 0; i < emailsToSend.length; i += BATCH_SIZE) {
            batches.push({
                emails: emailsToSend.slice(i, i + BATCH_SIZE),
                contacts: contacts.slice(i, i + BATCH_SIZE)
            })
        }

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex]
            console.log(`Sending batch ${batchIndex + 1}/${batches.length} (${batch.emails.length} emails)`)

            const result = await sendBatchEmails(batch.emails)

            // Process results
            const eventsToInsert: any[] = []

            result.items.forEach((item, index) => {
                const contact = batch.contacts.find(c => c.email === item.to) || batch.contacts[index]

                if (item.status === 'sent') {
                    sentCount++
                    if (contact) {
                        eventsToInsert.push({
                            campaign_id: campaign.id,
                            contact_id: contact.id,
                            event_type: 'sent',
                            event_data: { message_id: item.messageId || 'unknown' },
                            timestamp: new Date().toISOString()
                        })
                    }
                } else {
                    failCount++
                    errors.push({ batch: batchIndex, error: `${item.to}: ${item.error || 'Failed'}` })
                    console.error(`Failed to send to ${item.to}: ${item.error}`)
                }
            })

            if (eventsToInsert.length > 0) {
                await supabase.from('email_events').insert(eventsToInsert)
            }

            // Small delay between batches if there are multiple
            if (batchIndex < batches.length - 1) {
                await new Promise(r => setTimeout(r, 1000))
            }
        }

        // 5. Update Campaign Stats
        if (sentCount > 0) {
            await supabase
                .from('email_campaigns')
                .update({
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    total_sent: sentCount
                })
                .eq('id', campaign.id)
        } else {
            console.log('Campaign failed to send to any recipients. Keeping status as draft.')
        }

        return NextResponse.json({
            success: true,
            total: contacts.length,
            sent: sentCount,
            failed: failCount,
            errors: errors.length > 0 ? errors : undefined
        })

    } catch (err) {
        console.error('Send Error:', err)
        return NextResponse.json({ error: 'Failed to execute send' }, { status: 500 })
    }
}
