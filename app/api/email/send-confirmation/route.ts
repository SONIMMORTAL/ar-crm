import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateQRCodeDataURL } from '@/lib/qr-generator'
import { sendRegistrationConfirmation } from '@/lib/email-service'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { contactId, attendanceId, eventId } = body

        if (!contactId || !attendanceId || !eventId) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Fetch details
        const [contactRes, eventRes] = await Promise.all([
            supabase.from('contacts').select('*').eq('id', contactId).single(),
            supabase.from('events').select('*').eq('id', eventId).single()
        ])

        if (contactRes.error || !contactRes.data) {
            throw new Error('Contact not found')
        }
        if (eventRes.error || !eventRes.data) {
            throw new Error('Event not found')
        }

        const contact = contactRes.data
        const event = eventRes.data

        // Generate QR
        const qrData = `${process.env.NEXT_PUBLIC_APP_URL}/checkin/verify/${attendanceId}`
        const qrDataURL = await generateQRCodeDataURL(qrData)

        // Save QR data to attendance record if not already there
        await supabase
            .from('attendance')
            .update({ qr_code_data: qrData })
            .eq('id', attendanceId)

        // Send Email
        const emailResult = await sendRegistrationConfirmation({
            toEmail: contact.email,
            toName: contact.first_name || 'Guest',
            eventName: event.name,
            eventDate: event.event_date,
            eventLocation: event.location,
            qrCodeDataURL: qrDataURL,
            attendanceId: attendanceId
        })

        // Log Sync Event
        await supabase.from('sync_logs').insert({
            service: 'resend',
            operation: 'email_confirmation',
            status: emailResult.success ? 'success' : 'error',
            records_affected: 1,
            error_message: emailResult.error || null
        })

        if (!emailResult.success) {
            return NextResponse.json({ success: false, error: emailResult.error }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
