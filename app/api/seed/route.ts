import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createAdminClient()

    // Create Event
    const { data: event, error } = await supabase.from('events').insert({
        name: 'Example Event',
        slug: 'example-event',
        event_date: '2025-12-25T18:00:00Z',
        location: '123 Main St, New York, NY',
        description: 'An example event for testing registration.'
    }).select().single()

    if (error) return NextResponse.json({ error }, { status: 500 })

    return NextResponse.json({ success: true, event })
}
