import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = createAdminClient()

    try {
        // Fetch Campaign Info
        const { data: campaign, error: campError } = await supabase
            .from('email_campaigns')
            .select('*')
            .eq('id', id)
            .single()

        if (campError || !campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        // Fetch Events with Contact Info
        const { data: events, error: eventError } = await supabase
            .from('email_events')
            .select(`
                *,
                contacts (email, first_name, last_name)
            `)
            .eq('campaign_id', id)
            .order('timestamp', { ascending: false })

        if (eventError) throw eventError

        return NextResponse.json({ campaign, events })
    } catch (err) {
        console.error('Report API Error:', err)
        return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
    }
}
