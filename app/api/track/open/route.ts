import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
)

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const campaignId = searchParams.get('cid')
    const contactId = searchParams.get('uid')

    if (campaignId && contactId) {
        try {
            const supabase = createAdminClient()

            // Check if already opened to avoid duplicate events
            const { data: existing } = await supabase
                .from('email_events')
                .select('id')
                .eq('campaign_id', campaignId)
                .eq('contact_id', contactId)
                .eq('event_type', 'opened')
                .limit(1)

            if (!existing || existing.length === 0) {
                // Record the open event
                await supabase.from('email_events').insert({
                    campaign_id: campaignId,
                    contact_id: contactId,
                    event_type: 'opened',
                    timestamp: new Date().toISOString(),
                    event_data: {
                        user_agent: req.headers.get('user-agent') || 'unknown',
                        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
                    }
                })

                // Update campaign total_opens (direct SQL update)
                const { data: campaign } = await supabase
                    .from('email_campaigns')
                    .select('total_opens')
                    .eq('id', campaignId)
                    .single()

                await supabase
                    .from('email_campaigns')
                    .update({ total_opens: (campaign?.total_opens || 0) + 1 })
                    .eq('id', campaignId)

                console.log(`[Track] Email opened: campaign=${campaignId}, contact=${contactId}`)
            }
        } catch (err) {
            console.error('[Track] Error recording open:', err)
        }
    }

    // Return the tracking pixel
    return new NextResponse(TRACKING_PIXEL, {
        status: 200,
        headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    })
}
