import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { nbClient } from '@/lib/integrations/nationbuilder-client'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { attendanceId } = body

        if (!attendanceId) {
            return NextResponse.json({ error: 'Missing attendanceId' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // 1. Fetch Attendance + Event + Contact
        const { data: att, error } = await supabase
            .from('attendance')
            .select(`
                *,
                contacts (*),
                events (name, slug, event_date)
            `)
            .eq('id', attendanceId)
            .single()

        if (error || !att) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 })
        }

        const contact = att.contacts
        const event = att.events

        if (!contact) return NextResponse.json({ error: 'Contact missing' }, { status: 400 })

        // 2. Ensure Contact Exists in NB
        let nbId = contact.nationbuilder_id
        if (!nbId) {
            // Create if missing
            nbId = await nbClient.createPerson({
                email: contact.email,
                firstName: contact.first_name || undefined,
                lastName: contact.last_name || undefined
            }, contact.id)

            if (nbId) {
                await supabase.from('contacts').update({ nationbuilder_id: String(nbId) }).eq('id', contact.id)
            }
        }

        if (!nbId) {
            return NextResponse.json({ error: 'Failed to sync contact to NB' }, { status: 500 })
        }

        // 3. Add "Attended" Tag
        // Tag format: Attended_EventSlug_Date
        const dateStr = new Date(event?.event_date || Date.now()).toISOString().split('T')[0]
        const tag = `Attended_${event?.slug || 'Event'}_${dateStr}`

        await nbClient.addTag(String(nbId), tag, contact.id)

        return NextResponse.json({ success: true, tag })

    } catch (err: any) {
        console.error('Sync Error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
