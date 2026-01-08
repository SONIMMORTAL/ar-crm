import { NextRequest, NextResponse } from 'next/server'
import { mcClient } from '@/lib/integrations/mailchimp-client'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
    try {
        const campaigns = await mcClient.getCampaigns(10) // fetch latest 10
        return NextResponse.json({ campaigns })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { campaignId } = body

        if (!campaignId) return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })

        const report = await mcClient.getCampaignReport(campaignId)

        // Save to DB
        const supabase = createAdminClient()

        // Upsert email_campaigns based on mailchimp_id
        // We only have basic info from Mailchimp, so we fill defaults.
        const { error } = await supabase
            .from('email_campaigns')
            .upsert({
                mailchimp_id: report.id,
                name: report.title,
                subject: report.subject,
                status: report.status === 'sent' ? 'sent' : 'draft', // simple mapping
                total_sent: report.stats?.emails_sent || 0,
                total_opens: report.stats?.opens || 0,
                total_clicks: report.stats?.clicks || 0,
                total_bounces: report.stats?.bounces || 0,
                body_html: 'Imported from Mailchimp', // placeholder
                sent_at: new Date().toISOString() // approximation or need to fetch send_time
            }, { onConflict: 'mailchimp_id' })

        if (error) throw error

        return NextResponse.json({ success: true, report })

    } catch (err: any) {
        console.error('Campaign Sync Error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
