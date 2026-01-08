'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'

export default function WebhookTester() {
    const [eventType, setEventType] = useState('email.delivered')
    const [payload, setPayload] = useState(JSON.stringify({
        type: 'email.delivered',
        created_at: new Date().toISOString(),
        data: {
            id: 'msg_1234567890',
            to: ['user@example.com'],
            subject: 'Welcome to AR CRM',
            campaign_id: 'campaign_123'
        }
    }, null, 2))
    const [loading, setLoading] = useState(false)
    const [lastResponse, setLastResponse] = useState<string | null>(null)

    const handleSend = async () => {
        setLoading(true)
        setLastResponse(null)
        try {
            const res = await fetch('/api/email/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload
            })
            const data = await res.json().catch(() => ({}))

            setLastResponse(`Status: ${res.status}\nBody: ${JSON.stringify(data, null, 2)}`)

            if (res.ok) {
                toast.success('Webhook Sent Successfully')
            } else {
                toast.error('Webhook Failed')
            }
        } catch (e: any) {
            setLastResponse(`Error: ${e.message}`)
            toast.error('Network Error')
        } finally {
            setLoading(false)
        }
    }

    const updateTemplate = (type: string) => {
        setEventType(type)
        const template = {
            type,
            created_at: new Date().toISOString(),
            data: {
                id: `msg_${Math.floor(Math.random() * 10000)}`,
                to: ['user@example.com'],
                subject: 'Test Subject',
                campaign_id: 'campaign_123'
            }
        }
        setPayload(JSON.stringify(template, null, 2))
    }

    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Webhook Tester</h1>
                <p className="text-muted-foreground mt-2">Simulate incoming provider webhooks (Resend/Mailchimp).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>Construct the payload.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Event Type</Label>
                            <Select value={eventType} onValueChange={updateTemplate}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="email.delivered">Delivered</SelectItem>
                                    <SelectItem value="email.opened">Opened</SelectItem>
                                    <SelectItem value="email.clicked">Clicked</SelectItem>
                                    <SelectItem value="email.bounced">Bounced</SelectItem>
                                    <SelectItem value="email.complained">Complained</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>JSON Payload</Label>
                            <Textarea
                                value={payload}
                                onChange={(e) => setPayload(e.target.value)}
                                className="h-[300px] font-mono text-xs"
                            />
                        </div>
                        <Button onClick={handleSend} disabled={loading} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {!loading && <Play className="mr-2 h-4 w-4" />}
                            Trigger Webhook
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Response Log</CardTitle>
                        <CardDescription>Result from the API endpoint.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-slate-950 text-slate-50 p-4 rounded-md h-[400px] overflow-auto font-mono text-xs whitespace-pre-wrap">
                            {lastResponse || '// Waiting for request...'}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
