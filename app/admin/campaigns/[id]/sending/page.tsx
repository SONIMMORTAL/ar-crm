'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, AlertOctagon, ArrowLeft, FileText } from 'lucide-react'
import { Database } from '@/types/database'

type Campaign = Database['public']['Tables']['email_campaigns']['Row']

export default function SendingPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string
    const supabase = createClient()

    const [status, setStatus] = useState<'initiating' | 'sending' | 'completed' | 'error'>('initiating')
    const [progress, setProgress] = useState(0)
    const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0 })
    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    useEffect(() => {
        // Fetch Campaign Info first
        async function init() {
            const { data } = await supabase.from('email_campaigns').select('*').eq('id', id).single()
            if (data) setCampaign(data)

            // Start the send
            startSending()
        }
        init()
    }, [id])

    const startSending = async () => {
        setStatus('sending')
        try {
            // Call the long-running API
            // Ideally we'd use Server Sent Events (SSE) or a job queue polling mechanism
            // For MVP Day 4, the API waits until finished. We'll simulate progress if feasible or just wait.
            // Since our API currently awaits the loop, the frontend will hang until done.
            // To make it feel better, we can show an "Processing..." state.

            // NOTE: In a real app with >1000 emails, this MUST be async (status 202) + polling.
            const res = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to send')

            setStats({
                total: data.total,
                sent: data.sent,
                failed: data.failed
            })
            setProgress(100)
            setStatus('completed')

        } catch (err) {
            console.error(err)
            setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
            setStatus('error')
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle>
                        {status === 'initiating' && 'Preparing Campaign...'}
                        {status === 'sending' && 'Sending Campaign...'}
                        {status === 'completed' && 'Campaign Sent!'}
                        {status === 'error' && 'Sending Failed'}
                    </CardTitle>
                    <CardDescription>
                        {campaign?.name || 'Loading details...'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Progress Indicator */}
                    <div className="space-y-2">
                        {status === 'sending' && (
                            <div className="flex justify-center py-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin relative z-10" />
                                </div>
                            </div>
                        )}

                        {status === 'completed' && (
                            <div className="flex justify-center py-6 text-green-600">
                                <CheckCircle className="w-20 h-20" />
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="flex justify-center py-6 text-red-600">
                                <AlertOctagon className="w-20 h-20" />
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    {status === 'completed' && (
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-slate-100 p-3 rounded">
                                <div className="text-2xl font-bold">{stats.sent}</div>
                                <div className="text-xs text-muted-foreground uppercase">Sent</div>
                            </div>
                            <div className="bg-slate-100 p-3 rounded">
                                <div className="text-2xl font-bold">{stats.failed}</div>
                                <div className="text-xs text-muted-foreground uppercase">Failed</div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {errorMsg && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                            Error: {errorMsg}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 justify-center pt-4">
                        {status === 'completed' && (
                            <Button onClick={() => router.push(`/admin/campaigns/${id}/report`)} className="w-full bg-blue-600 hover:bg-blue-700">
                                <FileText className="w-4 h-4 mr-2" /> View Detailed Report
                            </Button>
                        )}

                        {status === 'completed' || status === 'error' ? (
                            <Button variant="outline" onClick={() => router.push('/admin/campaigns')} className="w-full">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                            </Button>
                        ) : (
                            <p className="text-xs text-slate-400">Please do not close this window.</p>
                        )}
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}
