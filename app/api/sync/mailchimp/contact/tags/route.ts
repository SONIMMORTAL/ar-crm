import { NextRequest, NextResponse } from 'next/server'
import { mcClient } from '@/lib/integrations/mailchimp-client'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { audienceId, email, tags } = body

        if (!audienceId || !email || !tags) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // tags should be array of { name: string, status: 'active' | 'inactive' }
        await mcClient.updateMemberTags(audienceId, email, tags)

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('Tag Sync Error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
