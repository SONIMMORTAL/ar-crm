'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, RefreshCw, AlertCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function MailchimpPage() {
    const [syncing, setSyncing] = useState(false)
    const [importing, setImporting] = useState(false)
    const [audienceId, setAudienceId] = useState('')
    const [configStatus, setConfigStatus] = useState<'loading' | 'configured' | 'missing'>('loading')
    const [lastResult, setLastResult] = useState<{ success: number, failed: number, errors: any[] } | null>(null)
    const [importResult, setImportResult] = useState<{ total: number, imported: number, failed: number, errors?: any[] } | null>(null)

    // Tag State
    const [tagEmail, setTagEmail] = useState('')
    const [tagName, setTagName] = useState('')
    const [tagging, setTagging] = useState(false)

    // Campaign State
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [loadingCampaigns, setLoadingCampaigns] = useState(false)
    const [syncingCampaign, setSyncingCampaign] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/sync/mailchimp/config')
            .then(res => res.json())
            .then(data => setConfigStatus(data.configured ? 'configured' : 'missing'))
            .catch(() => setConfigStatus('missing'))

        // Fetch Campaigns
        setLoadingCampaigns(true)
        fetch('/api/sync/mailchimp/campaigns')
            .then(res => res.json())
            .then(data => {
                if (data.campaigns) setCampaigns(data.campaigns)
            })
            .catch(console.error)
            .finally(() => setLoadingCampaigns(false))
    }, [])

    const handleImport = async () => {
        if (!audienceId) return alert('Please enter an Audience ID to import from.')

        setImporting(true)
        setImportResult(null)

        try {
            const res = await fetch('/api/sync/mailchimp/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audienceId })
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Import Failed')

            setImportResult(json)

        } catch (e: any) {
            alert(`Error: ${e.message}`)
            console.error(e)
        } finally {
            setImporting(false)
        }
    }

    const handleSync = async () => {
        if (!audienceId) return alert('Please enter an Audience ID to test.')

        setSyncing(true)
        setLastResult(null)

        try {
            const res = await fetch('/api/sync/mailchimp/audience', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audienceId,
                    syncAll: true
                })
            })

            const json = await res.json()

            if (!res.ok) {
                throw new Error(json.error || 'Sync Failed')
            }

            setLastResult(json)

        } catch (e: any) {
            alert(`Error: ${e.message}`)
            console.error(e)
        } finally {
            setSyncing(false)
        }
    }

    const handleTag = async (status: 'active' | 'inactive') => {
        if (!audienceId || !tagEmail || !tagName) return alert('Please fill in Audience ID, Email, and Tag.')

        setTagging(true)
        try {
            const res = await fetch('/api/sync/mailchimp/contact/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audienceId,
                    email: tagEmail,
                    tags: [{ name: tagName, status }]
                })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error)
            alert(`Tag ${status === 'active' ? 'Added' : 'Removed'}!`)
            setTagName('')
        } catch (e: any) {
            alert(`Error: ${e.message}`)
        } finally {
            setTagging(false)
        }
    }

    const handleSyncCampaign = async (campaignId: string) => {
        setSyncingCampaign(campaignId)
        try {
            const res = await fetch('/api/sync/mailchimp/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error)
            alert('Campaign Stats Synced!')
        } catch (e: any) {
            alert(`Error: ${e.message}`)
        } finally {
            setSyncingCampaign(null)
        }
    }

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Mail className="w-8 h-8 text-yellow-500" /> Mailchimp Integration
            </h1>

            <Tabs defaultValue="contacts" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="contacts">Contacts & Audience</TabsTrigger>
                    <TabsTrigger value="campaigns">Campaign Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="contacts" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Audience Sync</CardTitle>
                                <CardDescription>
                                    Push your CRM contacts to a Mailchimp Audience.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Audience ID</Label>
                                    <Input
                                        placeholder="e.g. 12345abcde"
                                        value={audienceId}
                                        onChange={e => setAudienceId(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">Find this in your Mailchimp Audience Settings.</p>
                                </div>

                                <Button onClick={handleSync} disabled={syncing} className="w-full">
                                    {syncing ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2 w-4 h-4" />}
                                    Sync Segment
                                </Button>

                                {configStatus === 'missing' && (
                                    <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 flex gap-2">
                                        <AlertCircle className="w-4 h-4 mt-0.5" />
                                        <div>
                                            <strong>Setup Required:</strong> Add <code>MAILCHIMP_API_KEY</code> and <code>MAILCHIMP_SERVER_PREFIX</code> to your Env variables.
                                        </div>
                                    </div>
                                )}

                                {lastResult && (
                                    <div className="space-y-3 pt-4 border-t">
                                        <div className="text-sm font-medium">Sync Results:</div>
                                        <div className="grid grid-cols-2 gap-2 text-center">
                                            <div className="bg-green-50 p-2 rounded text-green-700">
                                                <div className="text-xl font-bold">{lastResult.success}</div>
                                                <div className="text-xs">Synced</div>
                                            </div>
                                            <div className="bg-red-50 p-2 rounded text-red-700">
                                                <div className="text-xl font-bold">{lastResult.failed}</div>
                                                <div className="text-xs">Failed</div>
                                            </div>
                                        </div>
                                        {lastResult.errors.length > 0 && (
                                            <div className="bg-slate-50 p-3 rounded text-xs space-y-1 max-h-40 overflow-y-auto">
                                                <div className="font-semibold text-slate-700 mb-1">Errors:</div>
                                                {lastResult.errors.map((err, i) => (
                                                    <div key={i} className="text-red-600 break-all">
                                                        <span className="font-mono">{err.email}</span>: {err.error}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Webhooks</CardTitle>
                                <CardDescription>
                                    Receive updates from Mailchimp.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Webhook URL</Label>
                                    <div className="p-2 bg-slate-100 rounded text-sm font-mono break-all select-all">
                                        https://your-app.vercel.app/api/sync/mailchimp/webhook
                                    </div>
                                </div>
                                <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                                    <li><strong>Unsubscribes</strong>: Auto-updates CRM contact status.</li>
                                    <li><strong>Email Changes</strong>: Updates contact email.</li>
                                    <li><strong>Cleaned</strong>: Marks invalid emails.</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Import Contacts</CardTitle>
                                <CardDescription>
                                    Pull contacts from Mailchimp to CRM.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Audience ID</Label>
                                    <Input
                                        placeholder="e.g. 12345abcde"
                                        value={audienceId}
                                        onChange={e => setAudienceId(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleImport} disabled={importing} variant="secondary" className="w-full">
                                    {importing ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2 w-4 h-4" />}
                                    Import from Mailchimp
                                </Button>

                                {importResult && (
                                    <div className="space-y-3 pt-4 border-t">
                                        <div className="text-sm font-medium">Import Results:</div>
                                        <div className="grid grid-cols-2 gap-2 text-center">
                                            <div className="bg-green-50 p-2 rounded text-green-700">
                                                <div className="text-xl font-bold">{importResult.imported}</div>
                                                <div className="text-xs">Imported</div>
                                            </div>
                                            <div className="bg-red-50 p-2 rounded text-red-700">
                                                <div className="text-xl font-bold">{importResult.failed}</div>
                                                <div className="text-xs">Failed</div>
                                            </div>
                                            {importResult.total > 0 && <div className="col-span-2 text-xs text-muted-foreground">Total in Audience: {importResult.total}</div>}
                                        </div>
                                        {importResult.errors && importResult.errors.length > 0 && (
                                            <div className="bg-slate-50 p-3 rounded text-xs space-y-1 max-h-40 overflow-y-auto">
                                                <div className="font-semibold text-slate-700 mb-1">Errors:</div>
                                                {importResult.errors.map((err, i) => (
                                                    <div key={i} className="text-red-600 break-all">
                                                        <span className="font-mono">{err.email}</span>: {err.error}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Tag Management</CardTitle>
                                <CardDescription>
                                    Manually tag a contact in Mailchimp.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Contact Email</Label>
                                    <Input
                                        placeholder="user@example.com"
                                        value={tagEmail}
                                        onChange={e => setTagEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tag Name</Label>
                                    <Input
                                        placeholder="e.g. VIP, Donor"
                                        value={tagName}
                                        onChange={e => setTagName(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => handleTag('active')} disabled={tagging} className="flex-1">
                                        {tagging ? <Loader2 className="animate-spin mr-2" /> : null}
                                        Add Tag
                                    </Button>
                                    <Button onClick={() => handleTag('inactive')} disabled={tagging} variant="destructive" className="flex-1">
                                        {tagging ? <Loader2 className="animate-spin mr-2" /> : null}
                                        Remove Tag
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="campaigns">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Campaigns</CardTitle>
                            <CardDescription>
                                Sync performance stats from your last 10 campaigns.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingCampaigns ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                            ) : (
                                <div className="space-y-4">
                                    {campaigns.map((c: any) => (
                                        <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <div className="font-medium">{c.settings.title}</div>
                                                <div className="text-sm text-muted-foreground">{c.settings.subject_line}</div>
                                                <div className="text-xs text-slate-400 mt-1">Status: {c.status} • Sent: {c.send_time ? new Date(c.send_time).toLocaleDateString() : 'N/A'}</div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={syncingCampaign === c.id}
                                                onClick={() => handleSyncCampaign(c.id)}
                                            >
                                                {syncingCampaign === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sync Stats'}
                                            </Button>
                                        </div>
                                    ))}
                                    {campaigns.length === 0 && <div className="text-center text-muted-foreground py-8">No campaigns found.</div>}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
