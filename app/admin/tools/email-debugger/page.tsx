'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Terminal } from 'lucide-react'

export default function EmailDebuggerPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const runTest = async () => {
        setLoading(true)
        setResult(null)
        try {
            const res = await fetch('/api/debug/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: email })
            })
            const data = await res.json()
            setResult(data)
        } catch (e: any) {
            setResult({ success: false, error: e.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 space-y-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold">Email Configuration Debugger</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Send Test Email</CardTitle>
                    <CardDescription>
                        This tool bypasses the application logic and tests the raw Resend connection.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Input
                            placeholder="Enter your email..."
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        <Button onClick={runTest} disabled={loading || !email}>
                            {loading ? 'Testing...' : 'Test Connection'}
                        </Button>
                    </div>

                    {result && (
                        <div className={`p-4 rounded-md border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center gap-2 mb-2 font-semibold">
                                {result.success ? <CheckCircle className="text-green-600" /> : <AlertCircle className="text-red-600" />}
                                {result.success ? 'Success' : 'Failed'}
                            </div>

                            <div className="bg-slate-900 text-slate-50 p-4 rounded text-xs font-mono overflow-auto">
                                <pre>{JSON.stringify(result, null, 2)}</pre>
                            </div>

                            {!result.success && result.debug?.hasKey === false && (
                                <p className="mt-2 text-red-600 text-sm">
                                    <strong>Diagnosis:</strong> The server cannot see the <code>RESEND_API_KEY</code> environment variable.
                                    Please restart the server completely.
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
