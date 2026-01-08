import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { nbClient } from '@/lib/integrations/nationbuilder-client'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { contactId } = body

        if (!contactId) {
            return NextResponse.json({ error: 'Missing contactId' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // 1. Fetch Contact
        const { data: contact, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', contactId)
            .single()

        if (error || !contact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
        }

        // 2. Sync to NB
        let nbId = contact.nationbuilder_id

        if (nbId) {
            // Update
            await nbClient.updatePerson(nbId, {
                tags: ['Syncd_CRM'] // Example tag update
            }, contactId)
        } else {
            // Create
            nbId = await nbClient.createPerson({
                email: contact.email,
                firstName: contact.first_name || undefined,
                lastName: contact.last_name || undefined,
                phone: contact.phone || undefined,
                tags: ['From_CRM']
            }, contactId)

            // Save NB ID back to CRM
            if (nbId) {
                await supabase.from('contacts').update({ nationbuilder_id: String(nbId) }).eq('id', contactId)
            }
        }

        return NextResponse.json({ success: true, nationbuilder_id: nbId })

    } catch (err: any) {
        console.error('Sync Error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
