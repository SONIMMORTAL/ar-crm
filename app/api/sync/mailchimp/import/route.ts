import { NextRequest, NextResponse } from 'next/server'
import { mcClient } from '@/lib/integrations/mailchimp-client'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { audienceId } = body

        if (!audienceId) {
            return NextResponse.json({ error: 'Missing audienceId' }, { status: 400 })
        }

        const members = await mcClient.getAudienceMembers(audienceId)

        if (!members || !Array.isArray(members)) {
            return NextResponse.json({ error: 'Failed to fetch members or no members found' }, { status: 400 })
        }

        const supabase = createAdminClient()
        const results = {
            total: members.length,
            imported: 0,
            failed: 0,
            errors: [] as any[]
        }

        for (const member of members) {
            try {
                const { error } = await supabase
                    .from('contacts')
                    .upsert({
                        email: member.email_address,
                        first_name: member.merge_fields?.FNAME || '',
                        last_name: member.merge_fields?.LNAME || '',
                        mailchimp_id: member.id
                    }, { onConflict: 'email' }) // upsert based on email

                if (error) throw error
                results.imported++
            } catch (e: any) {
                results.failed++
                results.errors.push({ email: member.email_address, error: e.message })
            }
        }

        return NextResponse.json(results)

    } catch (err: any) {
        console.error('Import Error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
