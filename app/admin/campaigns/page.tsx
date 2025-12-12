import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function CampaignsPage() {
    const supabase = await createClient()

    // Fetch campaigns
    const { data: campaigns, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        return <div className="p-8 text-red-500">Error loading campaigns: {error.message}</div>
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Email Campaigns</h1>
                    <p className="text-slate-500 mt-2">Manage your newsletters and event blasts.</p>
                </div>
                <Button asChild>
                    <Link href="/admin/campaigns/new">
                        <Plus className="w-4 h-4 mr-2" /> Create Campaign
                    </Link>
                </Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Sent</TableHead>
                            <TableHead className="text-right">Opens</TableHead>
                            <TableHead className="text-right">Clicks</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {campaigns && campaigns.length > 0 ? (
                            campaigns.map((campaign) => (
                                <TableRow key={campaign.id}>
                                    <TableCell className="font-medium">
                                        {campaign.name}
                                        <div className="text-xs text-muted-foreground">{campaign.subject}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            campaign.status === 'sent' ? 'default' :
                                                campaign.status === 'testing' ? 'secondary' : 'outline'
                                        }>
                                            {campaign.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{campaign.total_sent || 0}</TableCell>
                                    <TableCell className="text-right">
                                        {campaign.total_opens || 0}
                                        {campaign.total_sent && campaign.total_sent > 0 && (
                                            <span className="text-xs text-muted-foreground ml-1">
                                                ({Math.round(((campaign.total_opens || 0) / campaign.total_sent) * 100)}%)
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {campaign.total_clicks || 0}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/admin/campaigns/${campaign.id}`}>
                                                {campaign.status === 'sent' ? 'View Report' : 'Edit'}
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No campaigns found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
