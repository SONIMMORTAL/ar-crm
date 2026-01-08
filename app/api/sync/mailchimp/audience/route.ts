import { NextRequest, NextResponse } from 'next/server'
import { mcClient } from '@/lib/integrations/mailchimp-client'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { audienceId, contactIds, syncAll } = body

        if (!audienceId) {
            return NextResponse.json({ error: 'Missing audienceId' }, { status: 400 })
        }

        const supabase = createAdminClient()
        let contacts: any[] = []

        // 1. Fetch Contacts
        if (syncAll) {
            const { data, error } = await supabase
                .from('contacts')
                .select('email, first_name, last_name')

            if (error) throw error
            contacts = data || []
        } else if (contactIds && Array.isArray(contactIds)) {
            const { data, error } = await supabase
                .from('contacts')
                .select('email, first_name, last_name')
                .in('id', contactIds)

            if (error) throw error
            contacts = data || []
        } else {
            return NextResponse.json({ error: 'Missing contactIds or syncAll flag' }, { status: 400 })
        }

        const results = {
            total: contacts.length,
            success: 0,
            failed: 0,
            errors: [] as any[]
        }

        // 2. Sync Loop
        // Note: For real bulk, use Batch Operations endpoint (POST /batches)
        // For MVP, simple loop.
        for (const contact of contacts) {
            try {
                await mcClient.addContactToAudience(audienceId, {
                    email: contact.email,
                    first_name: contact.first_name || undefined,
                    last_name: contact.last_name || undefined
                })
                results.success++
            } catch (e: any) {
                results.failed++
                results.errors.push({ email: contact.email, error: e.message })
            }
        }

        return NextResponse.json(results)

    } catch (err: any) {
        console.error('MC Sync Error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
