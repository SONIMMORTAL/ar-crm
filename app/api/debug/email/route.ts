import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: Request) {
    const { to } = await req.json()
    const key = process.env.RESEND_API_KEY

    // Debug info
    const debug = {
        hasKey: !!key,
        keyPrefix: key ? key.substring(0, 5) : 'N/A',
        env: process.env.NODE_ENV
    }

    if (!key) {
        return NextResponse.json({
            success: false,
            error: 'No RESEND_API_KEY found in process.env',
            debug
        })
    }

    try {
        const resend = new Resend(key)
        const { data, error } = await resend.emails.send({
            from: 'Event CRM <onboarding@resend.dev>',
            to: [to],
            subject: 'Debugger Test',
            html: '<h1>Debug Email</h1><p>If you see this, the configuration is working.</p>'
        })

        if (error) {
            console.error('DEBUGGER ERROR:', error)
            return NextResponse.json({ success: false, error, debug })
        }

        console.log('DEBUGGER SUCCESS:', data)
        return NextResponse.json({ success: true, data, debug })

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message, debug })
    }
}
