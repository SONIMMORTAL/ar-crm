'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MetricCard } from '@/components/ui/metric-card'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { EngagementFunnel } from '@/components/ui/animated-progress'
import {
    Loader2, ArrowLeft, Mail, MousePointer, Eye, AlertTriangle,
    Users, ExternalLink, Clock, Search, TrendingUp, Sparkles,
    CheckCircle2, XCircle, BarChart3
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area
} from 'recharts'

interface CampaignAnalytics {
    campaign: {
        id: string
        name: string
        subject: string
        status: string
        sent_at: string | null
    }
    stats: {
        total_sent: number
        total_opens: number
        unique_opens: number
        total_clicks: number
        unique_clicks: number
        total_bounces: number
        total_complaints: number
        open_rate: string | number
        click_rate: string | number
        bounce_rate: string | number
        delivery_rate: string | number
    }
    funnel: Array<{ stage: string; count: number; rate: number | string }>
    contacts: Array<{
        id: string
        email: string
        first_name: string | null
        last_name: string | null
        first_opened_at: string | null
        open_count: number
        first_clicked_at: string | null
        click_count: number
        bounced: boolean
        complained: boolean
    }>
    timeline: Array<{ hour: string; opens: number; clicks: number }>
    topLinks: Array<{ url: string; clicks: number }>
}

export default function CampaignAnalyticsPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<CampaignAnalytics | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted) {
            fetchAnalytics()
        }
    }, [id, mounted])

    async function fetchAnalytics() {
        setLoading(true)
        try {
            const res = await fetch(`/api/campaigns/${id}/analytics`)
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } catch (err) {
            console.error('Failed to fetch analytics:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                        <BarChart3 className="w-12 h-12 text-indigo-500" />
                    </motion.div>
                    <p className="text-slate-600 font-medium">Analyzing campaign data...</p>
                </motion.div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-slate-600">Campaign not found or no analytics available.</p>
                    <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/campaigns')}>
                        Back to Campaigns
                    </Button>
                </div>
            </div>
        )
    }

    const { campaign, stats, funnel, contacts, timeline, topLinks } = data
    const filteredContacts = contacts.filter(c =>
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.first_name && c.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.last_name && c.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const openers = filteredContacts.filter(c => c.open_count > 0)
    const clickers = filteredContacts.filter(c => c.click_count > 0)

    // Prepare funnel data for visualization
    const funnelData = [
        { label: 'Sent', value: stats.total_sent, color: 'purple' as const },
        { label: 'Delivered', value: stats.total_sent - stats.total_bounces, color: 'blue' as const },
        { label: 'Opened', value: stats.unique_opens || stats.total_opens, color: 'green' as const },
        { label: 'Clicked', value: stats.unique_clicks || stats.total_clicks, color: 'orange' as const },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 px-6 py-4 sticky top-0 z-20"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/admin/campaigns')}
                            className="hover:bg-slate-100"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Campaigns
                        </Button>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                            <h1 className="font-bold text-lg text-slate-900">{campaign.name}</h1>
                            <p className="text-sm text-slate-500">{campaign.subject}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge
                            variant={campaign.status === 'sent' ? 'default' : 'secondary'}
                            className="bg-emerald-100 text-emerald-700 border-0"
                        >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {campaign.status}
                        </Badge>
                        {campaign.sent_at && (
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(campaign.sent_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>

            <div className="max-w-7xl mx-auto p-8 space-y-8">
                {/* Premium KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Open Rate"
                        value={`${stats.open_rate}%`}
                        subtitle={`${stats.unique_opens || stats.total_opens} unique opens`}
                        icon={<Eye className="w-6 h-6" />}
                        gradient="blue"
                        trend={Number(stats.open_rate) > 20 ? { value: 8, isPositive: true } : undefined}
                        delay={0}
                    />
                    <MetricCard
                        title="Click Rate"
                        value={`${stats.click_rate}%`}
                        subtitle={`${stats.unique_clicks || stats.total_clicks} unique clicks`}
                        icon={<MousePointer className="w-6 h-6" />}
                        gradient="green"
                        trend={Number(stats.click_rate) > 3 ? { value: 12, isPositive: true } : undefined}
                        delay={0.1}
                    />
                    <MetricCard
                        title="Delivered"
                        value={`${stats.delivery_rate}%`}
                        subtitle={`${stats.total_sent - stats.total_bounces} of ${stats.total_sent}`}
                        icon={<Mail className="w-6 h-6" />}
                        gradient="purple"
                        delay={0.2}
                    />
                    <MetricCard
                        title="Bounced"
                        value={`${stats.bounce_rate}%`}
                        subtitle={`${stats.total_bounces} bounces, ${stats.total_complaints} complaints`}
                        icon={<AlertTriangle className="w-6 h-6" />}
                        gradient="red"
                        delay={0.3}
                    />
                </div>

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="bg-white shadow-sm border">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                                Overview
                            </TabsTrigger>
                            <TabsTrigger value="contacts" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                                Contacts ({contacts.length})
                            </TabsTrigger>
                            <TabsTrigger value="links" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                                Links ({topLinks.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-6 mt-6">
                            <div className="grid lg:grid-cols-2 gap-6">
                                {/* Engagement Funnel */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <Card className="border-0 shadow-xl shadow-slate-200/50">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                                Engagement Funnel
                                            </CardTitle>
                                            <CardDescription>From sent to clicked</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <EngagementFunnel stages={funnelData} />
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Timeline Chart */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <Card className="border-0 shadow-xl shadow-slate-200/50 h-full">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-violet-500" />
                                                Engagement Over Time
                                            </CardTitle>
                                            <CardDescription>Hourly opens and clicks</CardDescription>
                                        </CardHeader>
                                        <CardContent className="h-[280px]">
                                            {timeline.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={timeline}>
                                                        <defs>
                                                            <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                            </linearGradient>
                                                            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                        <XAxis
                                                            dataKey="hour"
                                                            tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit' })}
                                                            stroke="#94a3b8"
                                                        />
                                                        <YAxis stroke="#94a3b8" />
                                                        <Tooltip
                                                            labelFormatter={(v) => new Date(v).toLocaleString()}
                                                            contentStyle={{
                                                                borderRadius: '12px',
                                                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                                                border: 'none'
                                                            }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="opens"
                                                            stroke="#6366f1"
                                                            strokeWidth={2}
                                                            fillOpacity={1}
                                                            fill="url(#colorOpens)"
                                                            name="Opens"
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="clicks"
                                                            stroke="#22c55e"
                                                            strokeWidth={2}
                                                            fillOpacity={1}
                                                            fill="url(#colorClicks)"
                                                            name="Clicks"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex items-center justify-center">
                                                    <div className="text-center">
                                                        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                                        <p className="text-slate-500">No timeline data yet</p>
                                                        <p className="text-xs text-slate-400 mt-1">Data appears after emails are opened</p>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </div>

                            {/* Quick Stats */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="grid grid-cols-2 md:grid-cols-4 gap-4"
                            >
                                {[
                                    { label: 'Total Sent', value: stats.total_sent, icon: Mail, bg: 'bg-violet-50', iconColor: 'text-violet-500' },
                                    { label: 'Total Opens', value: stats.total_opens, icon: Eye, bg: 'bg-blue-50', iconColor: 'text-blue-500' },
                                    { label: 'Total Clicks', value: stats.total_clicks, icon: MousePointer, bg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
                                    { label: 'Unique Openers', value: openers.length, icon: Users, bg: 'bg-amber-50', iconColor: 'text-amber-500' },
                                ].map((stat, index) => (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.8 + index * 0.05 }}
                                        whileHover={{ scale: 1.02 }}
                                        className="bg-white rounded-xl p-5 shadow-lg shadow-slate-200/50 flex items-center gap-4"
                                    >
                                        <div className={`p-3 rounded-xl ${stat.bg}`}>
                                            <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-slate-900">
                                                <AnimatedCounter value={stat.value} delay={0.9 + index * 0.1} />
                                            </p>
                                            <p className="text-xs text-slate-500">{stat.label}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </TabsContent>

                        {/* Contacts Tab */}
                        <TabsContent value="contacts" className="mt-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="border-0 shadow-xl shadow-slate-200/50">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Users className="w-5 h-5 text-indigo-500" />
                                                    Contact Engagement
                                                </CardTitle>
                                                <CardDescription>See who opened, clicked, or bounced</CardDescription>
                                            </div>
                                            <div className="relative w-72">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    placeholder="Search contacts..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-10 border-slate-200"
                                                />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-slate-50/80">
                                                    <tr className="text-left">
                                                        <th className="py-4 px-6 font-semibold text-slate-700">Contact</th>
                                                        <th className="py-4 px-4 font-semibold text-slate-700 text-center">Opens</th>
                                                        <th className="py-4 px-4 font-semibold text-slate-700 text-center">Clicks</th>
                                                        <th className="py-4 px-4 font-semibold text-slate-700">First Opened</th>
                                                        <th className="py-4 px-4 font-semibold text-slate-700 text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    <AnimatePresence>
                                                        {filteredContacts.slice(0, 50).map((contact, index) => (
                                                            <motion.tr
                                                                key={contact.id}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                                transition={{ delay: index * 0.02 }}
                                                                className="hover:bg-slate-50/80 transition-colors"
                                                            >
                                                                <td className="py-4 px-6">
                                                                    <div>
                                                                        <p className="font-medium text-slate-900">
                                                                            {contact.first_name} {contact.last_name}
                                                                        </p>
                                                                        <p className="text-sm text-slate-500">{contact.email}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="py-4 px-4 text-center">
                                                                    {contact.open_count > 0 ? (
                                                                        <Badge className="bg-blue-100 text-blue-700 font-semibold">
                                                                            {contact.open_count}
                                                                        </Badge>
                                                                    ) : (
                                                                        <span className="text-slate-400">—</span>
                                                                    )}
                                                                </td>
                                                                <td className="py-4 px-4 text-center">
                                                                    {contact.click_count > 0 ? (
                                                                        <Badge className="bg-emerald-100 text-emerald-700 font-semibold">
                                                                            {contact.click_count}
                                                                        </Badge>
                                                                    ) : (
                                                                        <span className="text-slate-400">—</span>
                                                                    )}
                                                                </td>
                                                                <td className="py-4 px-4 text-slate-500 text-sm">
                                                                    {contact.first_opened_at ? (
                                                                        <span className="flex items-center gap-1">
                                                                            <Clock className="w-3.5 h-3.5" />
                                                                            {new Date(contact.first_opened_at).toLocaleString()}
                                                                        </span>
                                                                    ) : '—'}
                                                                </td>
                                                                <td className="py-4 px-4 text-center">
                                                                    {contact.bounced && (
                                                                        <Badge variant="destructive">Bounced</Badge>
                                                                    )}
                                                                    {contact.complained && (
                                                                        <Badge variant="destructive">Spam</Badge>
                                                                    )}
                                                                    {!contact.bounced && !contact.complained && contact.click_count > 0 && (
                                                                        <Badge className="bg-emerald-500 text-white">Engaged</Badge>
                                                                    )}
                                                                    {!contact.bounced && !contact.complained && contact.open_count > 0 && contact.click_count === 0 && (
                                                                        <Badge variant="secondary">Opened</Badge>
                                                                    )}
                                                                    {!contact.bounced && !contact.complained && contact.open_count === 0 && (
                                                                        <Badge variant="outline" className="text-slate-500">Delivered</Badge>
                                                                    )}
                                                                </td>
                                                            </motion.tr>
                                                        ))}
                                                    </AnimatePresence>
                                                </tbody>
                                            </table>
                                            {filteredContacts.length === 0 && (
                                                <div className="p-12 text-center">
                                                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                                    <p className="text-slate-500">No contacts match your search</p>
                                                </div>
                                            )}
                                            {filteredContacts.length > 50 && (
                                                <div className="p-4 text-center text-sm text-slate-500 border-t bg-slate-50/50">
                                                    Showing first 50 of {filteredContacts.length} contacts
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </TabsContent>

                        {/* Links Tab */}
                        <TabsContent value="links" className="mt-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="border-0 shadow-xl shadow-slate-200/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ExternalLink className="w-5 h-5 text-indigo-500" />
                                            Link Performance
                                        </CardTitle>
                                        <CardDescription>Which links got the most clicks</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {topLinks.length > 0 ? (
                                            <div className="space-y-4">
                                                {topLinks.map((link, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        whileHover={{ scale: 1.01 }}
                                                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-white border border-slate-100 rounded-xl hover:shadow-lg transition-all"
                                                    >
                                                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                                                            {i + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <a
                                                                href={link.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 truncate"
                                                            >
                                                                {link.url}
                                                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                            </a>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <Badge className="bg-emerald-100 text-emerald-700 text-lg px-4 py-2 font-bold">
                                                                <AnimatedCounter value={link.clicks} />
                                                                <span className="ml-1 text-xs font-normal">clicks</span>
                                                            </Badge>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-16 text-center">
                                                <ExternalLink className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                                <p className="text-slate-500">No link click data available yet</p>
                                                <p className="text-xs text-slate-400 mt-1">Link tracking activates when recipients click links</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </TabsContent>
                    </Tabs>
                </motion.div>
            </div>
        </div>
    )
}
