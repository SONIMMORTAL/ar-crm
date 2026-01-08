import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = createAdminClient()

    try {
        // 1. Fetch Campaign with stats
        const { data: campaign, error: campError } = await supabase
            .from('email_campaigns')
            .select('*')
            .eq('id', id)
            .single()

        if (campError || !campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        // 2. Calculate derived rates
        const totalSent = campaign.total_sent || 0
        const uniqueOpens = campaign.unique_opens || 0
        const uniqueClicks = campaign.unique_clicks || 0
        const totalBounces = campaign.total_bounces || 0

        const stats = {
            total_sent: totalSent,
            total_opens: campaign.total_opens || 0,
            unique_opens: uniqueOpens,
            total_clicks: campaign.total_clicks || 0,
            unique_clicks: uniqueClicks,
            total_bounces: totalBounces,
            total_complaints: campaign.total_complaints || 0,
            // Calculated rates
            open_rate: totalSent > 0
                ? (uniqueOpens / totalSent * 100).toFixed(1)
                : 0,
            click_rate: uniqueOpens > 0
                ? (uniqueClicks / uniqueOpens * 100).toFixed(1)
                : 0,
            bounce_rate: totalSent > 0
                ? (totalBounces / totalSent * 100).toFixed(1)
                : 0,
            delivery_rate: totalSent > 0
                ? ((totalSent - totalBounces) / totalSent * 100).toFixed(1)
                : 0
        }

        // 3. Fetch per-contact engagement breakdown
        const { data: contactEngagement } = await supabase
            .from('email_events')
            .select(`
                contact_id,
                event_type,
                timestamp,
                event_data,
                contacts (id, email, first_name, last_name)
            `)
            .eq('campaign_id', id)
            .order('timestamp', { ascending: false })

        // 4. Aggregate contact-level stats
        const contactMap = new Map<string, any>()

        for (const event of contactEngagement || []) {
            const contact = event.contacts as any
            if (!contact) continue

            if (!contactMap.has(contact.id)) {
                contactMap.set(contact.id, {
                    id: contact.id,
                    email: contact.email,
                    first_name: contact.first_name,
                    last_name: contact.last_name,
                    sent_at: null,
                    delivered_at: null,
                    first_opened_at: null,
                    open_count: 0,
                    first_clicked_at: null,
                    click_count: 0,
                    bounced: false,
                    complained: false
                })
            }

            const entry = contactMap.get(contact.id)!

            switch (event.event_type) {
                case 'sent':
                    if (!entry.sent_at) entry.sent_at = event.timestamp
                    break
                case 'delivered':
                    if (!entry.delivered_at) entry.delivered_at = event.timestamp
                    break
                case 'opened':
                    if (!entry.first_opened_at) entry.first_opened_at = event.timestamp
                    entry.open_count++
                    break
                case 'clicked':
                    if (!entry.first_clicked_at) entry.first_clicked_at = event.timestamp
                    entry.click_count++
                    break
                case 'bounced':
                    entry.bounced = true
                    break
                case 'complained':
                    entry.complained = true
                    break
            }
        }

        const contacts = Array.from(contactMap.values())

        // 5. Get timeline data (hourly engagement)
        const { data: timelineData } = await supabase
            .from('email_events')
            .select('event_type, timestamp')
            .eq('campaign_id', id)
            .in('event_type', ['opened', 'clicked'])
            .order('timestamp', { ascending: true })

        // Group by hour
        const timelineMap = new Map<string, { opens: number; clicks: number }>()
        for (const event of timelineData || []) {
            const hour = new Date(event.timestamp).toISOString().slice(0, 13) + ':00'
            if (!timelineMap.has(hour)) {
                timelineMap.set(hour, { opens: 0, clicks: 0 })
            }
            const entry = timelineMap.get(hour)!
            if (event.event_type === 'opened') entry.opens++
            if (event.event_type === 'clicked') entry.clicks++
        }

        const timeline = Array.from(timelineMap.entries())
            .map(([hour, data]) => ({ hour, ...data }))
            .slice(-48) // Last 48 hours

        // 6. Get top clicked links
        const { data: linkClicks } = await supabase
            .from('email_link_clicks')
            .select('link_url')
            .eq('campaign_id', id)

        const linkMap = new Map<string, number>()
        for (const click of linkClicks || []) {
            linkMap.set(click.link_url, (linkMap.get(click.link_url) || 0) + 1)
        }

        const topLinks = Array.from(linkMap.entries())
            .map(([url, count]) => ({ url, clicks: count }))
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 10)

        // 7. Funnel data
        const funnel = [
            { stage: 'Sent', count: stats.total_sent, rate: 100 },
            {
                stage: 'Delivered',
                count: stats.total_sent - stats.total_bounces,
                rate: stats.total_sent > 0 ? ((stats.total_sent - stats.total_bounces) / stats.total_sent * 100).toFixed(1) : 0
            },
            {
                stage: 'Opened',
                count: stats.unique_opens,
                rate: stats.open_rate
            },
            {
                stage: 'Clicked',
                count: stats.unique_clicks,
                rate: stats.click_rate
            }
        ]

        return NextResponse.json({
            campaign: {
                id: campaign.id,
                name: campaign.name,
                subject: campaign.subject,
                status: campaign.status,
                sent_at: campaign.sent_at
            },
            stats,
            funnel,
            contacts,
            timeline,
            topLinks
        })

    } catch (err: any) {
        console.error('Analytics API Error:', err)
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }
}
