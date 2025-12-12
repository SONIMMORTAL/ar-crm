'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Loader2, Save, Send, Users, FileText, CheckCircle, Mail } from 'lucide-react'
import { EmailEditor } from '@/components/email-editor'
import { Database } from '@/types/database'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CampaignTestModal } from '@/components/campaign-test-modal'
import { DeliverabilityTestResult } from '@/lib/mailreach-client'

type Campaign = Database['public']['Tables']['email_campaigns']['Row']

export default function EditCampaignPage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()
    const id = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [activeTab, setActiveTab] = useState('details')
    const [testModalOpen, setTestModalOpen] = useState(false)
    const [testResult, setTestResult] = useState<DeliverabilityTestResult | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        from_name: '',
        from_email: '',
        body_html: '',
    })

    useEffect(() => {
        async function fetchCampaign() {
            const { data, error } = await supabase
                .from('email_campaigns')
                .select('*')
                .eq('id', id)
                .single()

            if (data) {
                setCampaign(data)
                setFormData({
                    name: data.name,
                    subject: data.subject,
                    from_name: data.from_name || '',
                    from_email: data.from_email || '',
                    body_html: data.body_html || '',
                })
                if (data.deliverability_test_results) {
                    setTestResult(data.deliverability_test_results as any)
                }
            }
            setLoading(false)
        }

        fetchCampaign()
    }, [id, supabase])

    const handleSave = async () => {
        setSaving(true)
        const { error } = await supabase
            .from('email_campaigns')
            .update({
                name: formData.name,
                subject: formData.subject,
                from_name: formData.from_name || null,
                from_email: formData.from_email || null,
                body_html: formData.body_html,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        setSaving(false)
        if (!error) {
            // Show toaster ideally
        }
    }

    if (loading) {
        return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin" /></div>
    }

    if (!campaign) {
        return <div className="p-8">Campaign not found</div>
    }

    return (
        <div className="flex h-screen flex-col bg-slate-50">
            {/* Header */}
            <div className="border-b bg-white px-6 py-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/admin/campaigns')}>
                        &larr; Back
                    </Button>
                    <div>
                        <h1 className="font-semibold text-lg">{formData.name || 'Untitled Campaign'}</h1>
                        <p className="text-xs text-slate-500">{campaign.status}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Draft
                    </Button>
                    <Button size="sm" disabled={campaign.status !== 'draft'} onClick={() => setActiveTab('review')}>
                        Review & Send
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <div className="bg-white border-b px-6">
                        <TabsList className="w-full justify-start h-12 bg-transparent p-0">
                            <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-6">
                                Details
                            </TabsTrigger>
                            <TabsTrigger value="audience" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-6">
                                Audience
                            </TabsTrigger>
                            <TabsTrigger value="content" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-6">
                                Content
                            </TabsTrigger>
                            <TabsTrigger value="review" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-6">
                                Review
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-auto p-8">
                        <div className="max-w-4xl mx-auto space-y-8 pb-20">

                            {/* DETAILS TAB */}
                            <TabsContent value="details" className="mt-0">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Campaign Details</CardTitle>
                                        <CardDescription>Basic information about this email blast.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Internal Name</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g. Sept Newsletter"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="from_name">From Name</Label>
                                                <Input
                                                    id="from_name"
                                                    value={formData.from_name}
                                                    onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                                                    placeholder="My CRM"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="from_email">From Email</Label>
                                                <Input
                                                    id="from_email"
                                                    value={formData.from_email}
                                                    onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                                                    placeholder="hello@example.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="subject">Subject Line</Label>
                                            <Input
                                                id="subject"
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                placeholder="Big news inside..."
                                            />
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button onClick={() => setActiveTab('audience')}>Next: Audience</Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>

                            {/* AUDIENCE TAB - Placeholder for Day 3 */}
                            <TabsContent value="audience" className="mt-0">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Select Audience</CardTitle>
                                        <CardDescription>Who should receive this email?</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                                            Audience filtering logic coming soon. For now, this will send to All Contacts.
                                        </div>
                                        <div className="flex items-center space-x-2 border p-4 rounded-md">
                                            <Checkbox id="all-contacts" checked disabled />
                                            <Label htmlFor="all-contacts" className="flex-1">
                                                All Contacts
                                                <p className="text-xs text-muted-foreground">Send to everyone in your database.</p>
                                            </Label>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button onClick={() => setActiveTab('content')}>Next: Content</Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>

                            {/* CONTENT TAB */}
                            <TabsContent value="content" className="mt-0 space-y-4">
                                <Card className="border-0 shadow-none bg-transparent">
                                    <div className="grid gap-2 mb-4">
                                        <Label htmlFor="subject-editor">Subject</Label>
                                        <Input
                                            id="subject-editor"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="text-lg font-medium"
                                        />
                                    </div>

                                    <Label>Email Body</Label>
                                    <EmailEditor
                                        initialContent={formData.body_html}
                                        onChange={(html) => setFormData({ ...formData, body_html: html })}
                                    />
                                </Card>
                                <div className="flex justify-end">
                                    <Button onClick={() => setActiveTab('review')}>Next: Review</Button>
                                </div>
                            </TabsContent>

                            {/* REVIEW TAB */}
                            <TabsContent value="review" className="mt-0">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Review & Send</CardTitle>
                                        <CardDescription>Double check everything before blasting.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground block">Subject</span>
                                                <span className="font-medium">{formData.subject}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block">From</span>
                                                <span className="font-medium">{formData.from_name} &lt;{formData.from_email}&gt;</span>
                                            </div>
                                        </div>
                                        <div className="border rounded-md p-4 bg-gray-50 max-h-96 overflow-y-auto">
                                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formData.body_html }} />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between">
                                        <Button variant="ghost" onClick={handleSave}>Save as Draft</Button>
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={() => setTestModalOpen(true)}>
                                                {testResult ? 'View Test Report' : 'Test Deliverability'}
                                            </Button>
                                            <Button
                                                onClick={() => router.push(`/admin/campaigns/${id}/sending`)}
                                                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                <Send className="w-4 h-4" /> Send Now
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </TabsContent>

                        </div>
                    </div>
                </Tabs>
            </div>

            <CampaignTestModal
                open={testModalOpen}
                onOpenChange={setTestModalOpen}
                campaignId={id}
                onTestComplete={(res) => setTestResult(res)}
            />
        </div>
    )
}
