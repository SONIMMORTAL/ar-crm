import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { query, eventId } = body

        if (!query || !eventId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Search by name or email
        // Note: Supabase text search is tricky without full text search index,
        // so we'll do a simple ILIKE filter on the joined contacts table.
        // BUT nested filtering is hard.
        // Simpler approach: Find contacts first, then find their attendance.

        const { data: attendees, error } = await supabase
            .from('attendance')
            .select(`
                id,
                status,
                checked_in_at,
                contacts!inner (
                    id,
                    first_name,
                    last_name,
                    email
                )
            `)
            .eq('event_id', eventId)
            // This is checking if either first/last/email matches
            // We use 'or' at the contacts level? Supabase JS client doesn't support deep nested OR easily in one go.
            // Let's rely on RPC or just simple client side filtering if list is small? 
            // Better: Use the !inner join and filter on the relation
            .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`, { foreignTable: 'contacts' })
            .limit(20)

        if (error) throw error

        return NextResponse.json({ results: attendees })

    } catch (err) {
        console.error('Search Error', err)
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
}
