import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { first_name, last_name, email, phone, agree_updates, eventId, eventSlug } = body

        if (!email || !eventId || !first_name || !last_name) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // 1. Upsert Contact
        // We check for existing contact by email
        const { data: existingContact } = await supabase
            .from('contacts')
            .select('id')
            .eq('email', email)
            .single()

        let contactId = existingContact?.id

        if (contactId) {
            // Update existing
            await supabase.from('contacts').update({
                first_name,
                last_name,
                phone: phone || undefined,
                // Only update unsubscribed if they are re-subscribing, otherwise leave as is
                unsubscribed: agree_updates ? false : undefined
            }).eq('id', contactId)
        } else {
            // Create new
            const { data: newContact, error: createError } = await supabase.from('contacts').insert({
                email,
                first_name,
                last_name,
                phone,
                unsubscribed: !agree_updates
            }).select('id').single()

            if (createError) throw createError
            contactId = newContact.id
        }

        // 2. Register Attendance
        // Check if already registered
        const { data: existingAttendance } = await supabase
            .from('attendance')
            .select('id, status')
            .eq('contact_id', contactId)
            .eq('event_id', eventId)
            .single()

        if (existingAttendance) {
            if (existingAttendance.status === 'registered' || existingAttendance.status === 'checked_in') {
                return NextResponse.json({ success: false, error: 'You are already registered for this event!' }, { status: 400 })
            }
            // If cancelled, re-register? For now, just error.
            return NextResponse.json({ success: false, error: 'Registration status: ' + existingAttendance.status }, { status: 400 })
        }

        const { data: attendance, error: attendanceError } = await supabase.from('attendance').insert({
            contact_id: contactId,
            event_id: eventId,
            status: 'registered'
        }).select('id').single()

        if (attendanceError) throw attendanceError

        // 3. Trigger Confirmation Email (Async)
        // We call our own API or just execute logic here. calling API route to keep logic separated
        // actually, let's just use the direct logic to avoid self-call latency issues or auth issues
        // BUT, the prompt asked for `app/api/email/send-confirmation/route.ts`...
        // Let's call the URL of our app.

        // Better yet, let's just invoke the email service directly here if we are in the same environment.
        // However, to strictly follow the "Step 4" of Plan which implies a separate route, I will keep them separate BUT
        // for reliability I will call the logic directly here to ensure user sees success even if email fails in background (or we await it).
        // The previous plan had a dedicated route. I'll just fetch it.

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        fetch(`${appUrl}/api/email/send-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contactId,
                attendanceId: attendance.id,
                eventId
            })
        }).catch(err => console.error('Failed to trigger confirmation email:', err))

        return NextResponse.json({ success: true, contactId, attendanceId: attendance.id })

    } catch (error) {
        console.error('Registration API Error:', error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
