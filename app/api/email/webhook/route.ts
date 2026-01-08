import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { type, data } = body
    const supabase = await createClient()

    // 1. Validate Signature (Mocked for now)
    // const signature = req.headers.get('x-webhook-signature')
    // if (!isValid(signature)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Process Event
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
        return NextResponse.json({ success: true, message: 'Unhandled event type' })
    }

    try {
        // Find contact by email
        const recipientEmail = data.to?.[0]
        if (!recipientEmail) {
            return NextResponse.json({ success: true, message: 'No recipient email' })
        }

        const { data: contact } = await supabase
            .from('contacts')
            .select('id')
            .eq('email', recipientEmail)
            .single()

        if (!contact) {
            console.log(`[Webhook] Contact not found for email: ${recipientEmail}`)
            return NextResponse.json({ success: true, message: 'Contact not found' })
        }

        // Extract campaign_id from tags
        const campaignTag = data.tags?.find((t: any) => t.name === 'campaign_id')
        const campaignId = campaignTag?.value

        // Insert granular event record
        const eventPayload: any = {
            contact_id: contact.id,
            event_type: dbEventType,
            event_data: data,
            timestamp: new Date(data.created_at || Date.now()).toISOString()
        }

        if (campaignId) {
            eventPayload.campaign_id = campaignId
        }

        await supabase.from('email_events').insert(eventPayload)

        // Update campaign aggregate stats if we have a campaign_id
        if (campaignId) {
            await updateCampaignStats(supabase, campaignId, contact.id, dbEventType, data)
        }

        // Track link clicks specifically
        if (dbEventType === 'clicked' && data.link && campaignId) {
            await supabase.from('email_link_clicks').insert({
                campaign_id: campaignId,
                contact_id: contact.id,
                link_url: data.link
            })
        }

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('[Webhook] Error processing event:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/**
 * Update campaign aggregate statistics
 * Handles both total and unique counts
 */
async function updateCampaignStats(
    supabase: any,
    campaignId: string,
    contactId: string,
    eventType: string,
    eventData: any
) {
    // Check if this is a unique event (first time for this contact+campaign+event_type)
    const { data: existingEvent } = await supabase
        .from('email_events')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('contact_id', contactId)
        .eq('event_type', eventType)
        .limit(2) // We just inserted one, so check if there's more than 1

    const isUnique = !existingEvent || existingEvent.length <= 1

    // Build update object based on event type
    const updateFields: Record<string, any> = {}

    switch (eventType) {
        case 'opened':
            updateFields.total_opens = supabase.rpc ? undefined : 1 // Increment happens below
            if (isUnique) {
                // We need to increment, use raw SQL via update
            }
            break
        case 'clicked':
            if (isUnique) {
                // Track unique clicks
            }
            break
        case 'bounced':
            break
        case 'complained':
            break
    }

    // Use RPC or raw increment - Supabase doesn't support increment directly in update
    // So we fetch current values and increment
    const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('total_opens, total_clicks, total_bounces, total_complaints, unique_opens, unique_clicks')
        .eq('id', campaignId)
        .single()

    if (!campaign) return

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
        await supabase
            .from('email_campaigns')
            .update(updates)
            .eq('id', campaignId)
    }
}
