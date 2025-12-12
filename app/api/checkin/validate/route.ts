import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { qrData, eventId } = body

        if (!qrData || !eventId) {
            return NextResponse.json({ error: 'Missing Data' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // 1. Look up attendance record by QR Code + Event
        const { data: attendance, error } = await supabase
            .from('attendance')
            .select(`
                *,
                contacts (
                    first_name,
                    last_name,
                    email
                )
            `)
            .eq('qr_code_data', qrData)
            .eq('event_id', eventId)
            .single()

        if (error || !attendance) {
            return NextResponse.json({ error: 'Ticket not found for this event', code: 'NOT_FOUND' }, { status: 404 })
        }

        // 2. Check Status
        if (attendance.status === 'checked_in') {
            return NextResponse.json({
                status: 'already_checked_in',
                checkedInAt: attendance.checked_in_at,
                contact: attendance.contacts
            }, { status: 409 })
        }

        if (attendance.status === 'cancelled') {
            return NextResponse.json({
                error: 'Ticket cancelled',
                code: 'CANCELLED'
            }, { status: 400 })
        }

        // 3. Mark as Checked In
        const { error: updateError } = await supabase
            .from('attendance')
            .update({
                status: 'checked_in',
                checked_in_at: new Date().toISOString()
            })
            .eq('id', attendance.id)

        if (updateError) throw updateError

        return NextResponse.json({
            success: true,
            status: 'checked_in',
            contact: attendance.contacts
        })

    } catch (err) {
        console.error('Check-in Error', err)
        return NextResponse.json({ error: 'Server Error' }, { status: 500 })
    }
}
