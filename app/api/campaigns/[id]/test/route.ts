import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { testEmailDeliverability } from '@/lib/mailreach-client'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = createAdminClient()

        // 1. Fetch campaign
        const { data: campaign, error } = await supabase
            .from('email_campaigns')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        // 2. Run Test
        const result = await testEmailDeliverability({
            subject: campaign.subject,
            htmlBody: campaign.body_html,
            fromEmail: campaign.from_email || 'test@example.com',
            fromName: campaign.from_name || 'Test User',
        })

        // 3. Update DB
        const { error: updateError } = await supabase
            .from('email_campaigns')
            .update({
                status: 'testing',
                deliverability_test_results: result as any // Supabase JSON type casting
            })
            .eq('id', id)

        if (updateError) throw updateError

        return NextResponse.json(result)

    } catch (err) {
        console.error('Test Error:', err)
        return NextResponse.json({ error: 'Failed to run test' }, { status: 500 })
    }
}
