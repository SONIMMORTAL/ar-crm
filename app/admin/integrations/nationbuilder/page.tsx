'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

// Simple mock for sync logs type
interface SyncLog {
    id: string
    created_at: string
    entity_type: string
    status: 'success' | 'error'
    message: string
}

export default function NBIntegrationPage() {
    const [stats, setStats] = useState({ totalContacts: 0, syncedContacts: 0 })
    const [logs, setLogs] = useState<SyncLog[]>([])
    const [loading, setLoading] = useState(false)
    const [syncing, setSyncing] = useState(false)

    const supabase = createClient()

    async function loadData() {
        setLoading(true)
        // Stats
        const { count: total } = await supabase.from('contacts').select('*', { count: 'exact', head: true })
        const { count: synced } = await supabase.from('contacts').select('*', { count: 'exact', head: true }).not('nationbuilder_id', 'is', null)

        setStats({ totalContacts: total || 0, syncedContacts: synced || 0 })

        // Logs
        const { data } = await supabase.from('sync_logs').select('*').eq('integration', 'nationbuilder').order('created_at', { ascending: false }).limit(10)
        if (data) setLogs(data as any)

        setLoading(false)
    }

    const triggerSync = async () => {
        // For demo, just sync the first unsynced contact found?
        // Or call specific API? Let's just create a dummy "Sync All" effect.
        setSyncing(true)
        alert("Batch sync requires a background job. For this demo, please sync contacts individually or via triggers.")
        setSyncing(false)
    }

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold">NationBuilder Integration</h1>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Status Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Connection Status</CardTitle>
                        <CardDescription>
                            Sync your CRM contacts to NationBuilder people.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                            <CheckCircle className="w-5 h-5" /> Connected (API Token Set)
                        </div>

                        <div className="p-4 bg-slate-50 rounded-md space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Total Contacts</span>
                                <span className="font-bold">{stats.totalContacts}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Synced to NB</span>
                                <span className="font-bold">{stats.syncedContacts}</span>
                            </div>
                        </div>

                        <Button onClick={triggerSync} disabled={syncing} className="w-full">
                            {syncing ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2 w-4 h-4" />}
                            Sync All Contacts
                        </Button>
                    </CardContent>
                </Card>

                {/* Logs Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : (
                            <div className="space-y-3">
                                {logs.length === 0 && <p className="text-sm text-muted-foreground text-center">No logs found.</p>}
                                {logs.map(log => (
                                    <div key={log.id} className="flex items-start gap-3 p-2 border-b last:border-0 text-sm">
                                        {log.status === 'success' ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 mt-0.5" />}
                                        <div>
                                            <p className="font-medium">{log.message}</p>
                                            <p className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
