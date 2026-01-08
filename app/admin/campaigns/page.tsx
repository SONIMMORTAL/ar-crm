'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
    Plus, Mail, Search, Eye, MousePointer, MoreHorizontal,
    BarChart3, Send, FileEdit, Trash2, ArrowRight, Sparkles
} from 'lucide-react'

interface Campaign {
    id: string
    name: string
    subject: string
    status: 'draft' | 'testing' | 'sent'
    total_sent: number | null
    total_opens: number | null
    total_clicks: number | null
    created_at: string
}

export default function CampaignsPage() {
    const [mounted, setMounted] = useState(false)
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted) {
            fetchCampaigns()
        }
    }, [mounted])

    async function fetchCampaigns() {
        const { data, error } = await supabase
            .from('email_campaigns')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setCampaigns(data)
        }
        setLoading(false)
    }

    const filteredCampaigns = campaigns.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const sentCampaigns = campaigns.filter(c => c.status === 'sent')
    const draftCampaigns = campaigns.filter(c => c.status === 'draft')
    const totalSent = sentCampaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0)
    const totalOpens = sentCampaigns.reduce((sum, c) => sum + (c.total_opens || 0), 0)

    const statusConfig = {
        draft: { color: 'bg-slate-100 text-slate-700', label: 'Draft' },
        testing: { color: 'bg-amber-100 text-amber-700', label: 'Testing' },
        sent: { color: 'bg-emerald-100 text-emerald-700', label: 'Sent' }
    }

    return (
        <div className="min-h-screen p-8 space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
                        Email Campaigns
                    </h1>
                    <p className="text-slate-500 mt-1">Create, send, and track your email marketing campaigns</p>
                </div>
                <Button asChild className="bg-gradient-to-r from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
                    <Link href="/admin/campaigns/new">
                        <Plus className="w-4 h-4 mr-2" /> Create Campaign
                    </Link>
                </Button>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Campaigns', value: campaigns.length, icon: Mail, color: 'indigo' },
                    { label: 'Sent', value: sentCampaigns.length, icon: Send, color: 'emerald' },
                    { label: 'Drafts', value: draftCampaigns.length, icon: FileEdit, color: 'amber' },
                    { label: 'Total Opens', value: totalOpens, icon: Eye, color: 'blue' },
                ].map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-xl p-4 shadow-lg shadow-slate-200/50 flex items-center gap-4"
                    >
                        <div className={`p-2.5 rounded-lg bg-${stat.color}-100`}>
                            <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            <p className="text-xs text-slate-500">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Search & Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-4"
            >
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search campaigns..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white border-slate-200"
                    />
                </div>
            </motion.div>

            {/* Campaigns Grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                    </div>
                ) : filteredCampaigns.length > 0 ? (
                    <div className="grid gap-4">
                        <AnimatePresence>
                            {filteredCampaigns.map((campaign, index) => {
                                const openRate = campaign.total_sent && campaign.total_sent > 0
                                    ? ((campaign.total_opens || 0) / campaign.total_sent * 100).toFixed(1)
                                    : 0
                                const clickRate = campaign.total_opens && campaign.total_opens > 0
                                    ? ((campaign.total_clicks || 0) / campaign.total_opens * 100).toFixed(1)
                                    : 0

                                return (
                                    <motion.div
                                        key={campaign.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.03 }}
                                        whileHover={{ scale: 1.005 }}
                                        className="bg-white rounded-xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 hover:border-indigo-200 transition-all group"
                                    >
                                        <div className="flex items-center gap-6">
                                            {/* Icon */}
                                            <div className={`p-3 rounded-xl ${campaign.status === 'sent'
                                                    ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                                                    : campaign.status === 'testing'
                                                        ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                                        : 'bg-gradient-to-br from-slate-400 to-slate-500'
                                                } shadow-lg`}>
                                                <Mail className="w-5 h-5 text-white" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                        {campaign.name}
                                                    </h3>
                                                    <Badge className={statusConfig[campaign.status].color}>
                                                        {statusConfig[campaign.status].label}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-500 truncate mt-1">{campaign.subject}</p>
                                            </div>

                                            {/* Stats (for sent campaigns) */}
                                            {campaign.status === 'sent' && (
                                                <div className="flex items-center gap-6 text-center">
                                                    <div>
                                                        <p className="text-lg font-bold text-slate-900">{campaign.total_sent || 0}</p>
                                                        <p className="text-xs text-slate-500">Sent</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold text-blue-600">{campaign.total_opens || 0}</p>
                                                        <p className="text-xs text-slate-500">Opens</p>
                                                    </div>
                                                    <div>
                                                        <p className={`text-lg font-bold ${Number(openRate) >= 20 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                            {openRate}%
                                                        </p>
                                                        <p className="text-xs text-slate-500">Rate</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {campaign.status === 'sent' && (
                                                    <Button variant="ghost" size="sm" asChild className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                                        <Link href={`/admin/campaigns/${campaign.id}/analytics`}>
                                                            <BarChart3 className="w-4 h-4 mr-1" /> Analytics
                                                        </Link>
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/campaigns/${campaign.id}`}>
                                                        {campaign.status === 'sent' ? 'View' : 'Edit'}
                                                        <ArrowRight className="w-4 h-4 ml-1" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    <Card className="border-0 shadow-xl shadow-slate-200/50">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 mb-4">
                                <Mail className="w-10 h-10 text-indigo-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-2">No campaigns yet</h3>
                            <p className="text-slate-500 mb-6">Create your first email campaign to get started</p>
                            <Button asChild className="bg-gradient-to-r from-indigo-500 to-violet-600">
                                <Link href="/admin/campaigns/new">
                                    <Plus className="w-4 h-4 mr-2" /> Create Campaign
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </motion.div>
        </div>
    )
}
