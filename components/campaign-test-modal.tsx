'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, CheckCircle, XCircle, Gauge } from 'lucide-react'
import { DeliverabilityTestResult } from '@/lib/mailreach-client'
import { Badge } from '@/components/ui/badge'

interface CampaignTestModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    campaignId: string
    onTestComplete: (result: DeliverabilityTestResult) => void
}

export function CampaignTestModal({
    open,
    onOpenChange,
    campaignId,
    onTestComplete
}: CampaignTestModalProps) {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<DeliverabilityTestResult | null>(null)

    const runTest = async () => {
        setLoading(true)
        setResult(null)

        try {
            const res = await fetch(`/api/campaigns/${campaignId}/test`, { method: 'POST' })
            if (!res.ok) throw new Error('Test failed')

            const data = await res.json()
            setResult(data)
            onTestComplete(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-600'
        if (score >= 5) return 'text-yellow-600'
        return 'text-red-600'
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Deliverability Check</DialogTitle>
                    <DialogDescription>
                        We will send a seed email to checking networks to estimate your inbox placement.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {!result && !loading && (
                        <div className="text-center space-y-4">
                            <div className="bg-slate-100 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                                <Gauge className="w-10 h-10 text-slate-500" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                This test usually takes about 10-20 seconds for the mock simulation.
                            </p>
                            <Button onClick={runTest}>Start Test</Button>
                        </div>
                    )}

                    {loading && (
                        <div className="text-center space-y-4 py-8">
                            <Loader2 className="w-10 h-10 mx-auto animate-spin text-blue-600" />
                            <p className="font-medium animate-pulse">Running diagnostics...</p>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-6">
                            {/* Score */}
                            <div className="text-center">
                                <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">Spam Score</span>
                                <div className={`text-5xl font-bold mt-2 ${getScoreColor(result.spamScore)}`}>
                                    {result.spamScore}<span className="text-2xl text-slate-300">/10</span>
                                </div>
                            </div>

                            {/* Placement Table */}
                            <div className="border rounded-md overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-slate-500">Provider</th>
                                            <th className="px-3 py-2 text-right font-medium text-slate-500">Placement</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {result.placement.map((p, i) => (
                                            <tr key={i}>
                                                <td className="px-3 py-2 capitalize">{p.provider}</td>
                                                <td className="px-3 py-2 text-right">
                                                    <Badge variant={p.folder === 'inbox' ? 'default' : p.folder === 'promotions' ? 'secondary' : 'destructive'} className="uppercase text-[10px]">
                                                        {p.folder}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Recommendations */}
                            {result.recommendations.length > 0 && (
                                <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-700">
                                    <p className="font-semibold mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Recommendations
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {result.recommendations.map((rec, i) => (
                                            <li key={i}>{rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
                    {result && (
                        <Button variant="outline" onClick={runTest}>Re-test</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
