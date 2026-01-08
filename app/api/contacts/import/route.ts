import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { contacts } = body

        if (!contacts || !Array.isArray(contacts)) {
            return NextResponse.json({ error: 'Invalid contacts array' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Prepare data
        // Filter out invalid
        const validContacts = contacts.filter((c: any) => c.email && c.email.includes('@'))

        if (validContacts.length === 0) {
            return NextResponse.json({ error: 'No valid contacts found to import' }, { status: 400 })
        }

        // Upsert? Or just insert and ignore conflicts? 
        // Let's use upsert on email to be safe and helpful
        const { data, error } = await supabase.from('contacts').upsert(
            validContacts.map((c: any) => ({
                email: c.email,
                first_name: c.first_name,
                last_name: c.last_name,
                phone: c.phone
                // tags?
            })),
            { onConflict: 'email', ignoreDuplicates: true } // or false to update? user didn't specify. Let's ignore duplicates to prevent overwriting existing data accidentally.
        ).select()

        if (error) throw error

        return NextResponse.json({
            imported: data ? data.length : 0,
            requested: contacts.length
        })

    } catch (error: any) {
        console.error('Import Error', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
