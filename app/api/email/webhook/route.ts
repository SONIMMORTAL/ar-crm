import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    let body: any
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { type, data } = body
    console.log('[Webhook] Received:', type, JSON.stringify(data, null, 2))

    // Use admin client to bypass RLS
    const supabase = createAdminClient()

    if (!type || !data) {
        return NextResponse.json({ error: 'Invalid Payload' }, { status: 400 })
    }

    // Map Resend event types to our DB types
    const eventTypeMap: Record<string, string> = {
        'email.sent': 'sent',
        'email.delivered': 'delivered',
        'email.opened': 'opened',
        'email.clicked': 'clicked',
        'email.bounced': 'bounced',
        'email.complained': 'complained'
    }

    const dbEventType = eventTypeMap[type] || 'unknown'

    if (dbEventType === 'unknown') {
        console.log('[Webhook] Unhandled event type:', type)
        return NextResponse.json({ success: true, message: 'Unhandled event type' })
    }

    try {
        // Extract recipient email - Resend can send it in different formats
        let recipientEmail: string | null = null

        if (data.to) {
            if (typeof data.to === 'string') {
                recipientEmail = data.to
            } else if (Array.isArray(data.to) && data.to.length > 0) {
                // Could be array of strings or array of objects
                const first = data.to[0]
                recipientEmail = typeof first === 'string' ? first : first?.email
            }
        }

        // Also try data.email for opened/clicked events
        if (!recipientEmail && data.email) {
            recipientEmail = data.email
        }

        console.log('[Webhook] Recipient email:', recipientEmail)

        // Extract campaign_id from tags - Resend sends tags as object, not array
        let campaignId: string | null = null

        if (data.tags) {
            if (typeof data.tags === 'object' && !Array.isArray(data.tags)) {
                // Object format: { campaign_id: "uuid" }
                campaignId = data.tags.campaign_id || null
            } else if (Array.isArray(data.tags)) {
                // Array format: [{ name: "campaign_id", value: "uuid" }]
                const tag = data.tags.find((t: any) => t.name === 'campaign_id')
                campaignId = tag?.value || null
            }
        }

        console.log('[Webhook] Campaign ID:', campaignId)

        // Find contact by email (if we have one)
        let contactId: string | null = null

        if (recipientEmail) {
            const { data: contact } = await supabase
                .from('contacts')
                .select('id')
                .eq('email', recipientEmail)
                .single()

            if (contact) {
                contactId = contact.id
            } else {
                console.log('[Webhook] Contact not found for:', recipientEmail)
            }
        }

        // Insert event record (even if we don't have a contact, for debugging)
        if (campaignId) {
            const eventPayload: any = {
                campaign_id: campaignId,
                event_type: dbEventType,
                event_data: data,
                timestamp: new Date(data.created_at || Date.now()).toISOString()
            }

            if (contactId) {
                eventPayload.contact_id = contactId
            }

            const { error: insertError } = await supabase.from('email_events').insert(eventPayload)
            if (insertError) {
                console.error('[Webhook] Insert error:', insertError)
            } else {
                console.log('[Webhook] Event recorded:', dbEventType)
            }

            // Update campaign aggregate stats
            await updateCampaignStats(supabase, campaignId, contactId, dbEventType)
        }

        // Track link clicks specifically
        if (dbEventType === 'clicked' && data.link && campaignId && contactId) {
            await supabase.from('email_link_clicks').insert({
                campaign_id: campaignId,
                contact_id: contactId,
                link_url: data.link
            })
        }

        return NextResponse.json({ success: true, event: dbEventType, campaignId, contactId })

    } catch (err: any) {
        console.error('[Webhook] Error processing event:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/**
 * Update campaign aggregate statistics
 */
async function updateCampaignStats(
    supabase: any,
    campaignId: string,
    contactId: string | null,
    eventType: string
) {
    // Fetch current campaign stats
    const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('total_opens, total_clicks, total_bounces, total_complaints, unique_opens, unique_clicks')
        .eq('id', campaignId)
        .single()

    if (!campaign) {
        console.log('[Webhook] Campaign not found:', campaignId)
        return
    }

    // Check if this is a unique event
    let isUnique = true
    if (contactId) {
        const { data: existingEvents } = await supabase
            .from('email_events')
            .select('id')
            .eq('campaign_id', campaignId)
            .eq('contact_id', contactId)
            .eq('event_type', eventType)
            .limit(2)

        isUnique = !existingEvents || existingEvents.length <= 1
    }

    const updates: Record<string, number> = {}

    switch (eventType) {
        case 'opened':
            updates.total_opens = (campaign.total_opens || 0) + 1
            if (isUnique) {
                updates.unique_opens = (campaign.unique_opens || 0) + 1
            }
            break
        case 'clicked':
            updates.total_clicks = (campaign.total_clicks || 0) + 1
            if (isUnique) {
                updates.unique_clicks = (campaign.unique_clicks || 0) + 1
            }
            break
        case 'bounced':
            updates.total_bounces = (campaign.total_bounces || 0) + 1
            break
        case 'complained':
            updates.total_complaints = (campaign.total_complaints || 0) + 1
            break
    }

    if (Object.keys(updates).length > 0) {
        const { error } = await supabase
            .from('email_campaigns')
            .update(updates)
            .eq('id', campaignId)

        if (error) {
            console.error('[Webhook] Update error:', error)
        } else {
            console.log('[Webhook] Campaign stats updated:', updates)
        }
    }
}
