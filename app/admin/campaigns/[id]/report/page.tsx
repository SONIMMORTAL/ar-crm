'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle, MailOpen, MousePointer2 } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function CampaignReportPage() {
    const params = useParams()
    const id = params?.id as string
    const [loading, setLoading] = useState(true)
    const [campaign, setCampaign] = useState<any>(null)
    const [logs, setLogs] = useState<any[]>([])
    const [stats, setStats] = useState({ sent: 0, opened: 0, clicked: 0, failed: 0 })

    const supabase = createClient()

    useEffect(() => {
        if (id) fetchReport()
    }, [id])

    async function fetchReport() {
        setLoading(true)
        try {
            const res = await fetch(`/api/campaigns/${id}/report`)
            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            setCampaign(data.campaign)
            const events = data.events

            if (events) {
                setLogs(events)

                // Calculate Stats
                const sent = events.filter((e: any) => e.event_type === 'sent').length
                const opens = events.filter((e: any) => e.event_type === 'opened').length
                const clicks = events.filter((e: any) => e.event_type === 'clicked').length

                setStats({ sent, opened: opens, clicked: clicks, failed: 0 })
            }

        } catch (err) {
            console.error('Error fetching report:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">{campaign?.name} - Report</h1>
                    <p className="text-muted-foreground">Sent on {new Date(campaign?.sent_at).toLocaleString()}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Opened</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.opened}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Clicked</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats.clicked}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Log Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Delivery Log</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Recipient</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Message ID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <div className="font-medium">{log.contacts?.email}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {log.contacts?.first_name} {log.contacts?.last_name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            log.event_type === 'sent' ? 'default' :
                                                log.event_type === 'opened' ? 'secondary' : 'outline'
                                        }>
                                            {log.event_type === 'sent' && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                                            {log.event_type === 'opened' && <MailOpen className="w-3 h-3 mr-1 inline" />}
                                            {log.event_type.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                                    <TableCell className="font-mono text-xs">{log.event_data?.message_id}</TableCell>
                                </TableRow>
                            ))}
                            {logs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No logs found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
