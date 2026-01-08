import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        // Simple validation
        if (!body.email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Check if exists
        const { data: existing } = await supabase
            .from('contacts')
            .select('id')
            .eq('email', body.email)
            .single()

        if (existing) {
            return NextResponse.json({ error: 'Contact already exists' }, { status: 409 })
        }

        const { data, error } = await supabase.from('contacts').insert({
            email: body.email,
            first_name: body.first_name,
            last_name: body.last_name,
            phone: body.phone,
            tags: body.tags || []
        }).select().single()

        if (error) throw error

        return NextResponse.json(data)

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
