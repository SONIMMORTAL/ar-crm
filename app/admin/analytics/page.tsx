'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/ui/metric-card'
import { AnimatedCounter, AnimatedPercentage } from '@/components/ui/animated-counter'
import { EngagementFunnel } from '@/components/ui/animated-progress'
import {
    Loader2, TrendingUp, Users, Calendar, Mail, Eye, MousePointer,
    ArrowRight, RefreshCw, Sparkles, BarChart3, Target, Zap
} from 'lucide-react'
import Link from 'next/link'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444']

interface CampaignStat {
    id: string
    name: string
    subject: string
    status: string
    sent_at: string | null
    total_sent: number | null
    total_opens: number | null
    total_clicks: number | null
    total_bounces: number | null
}

export default function AnalyticsPage() {
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [stats, setStats] = useState({
        totalContacts: 0,
        totalEvents: 0,
        totalCampaigns: 0,
        avgOpenRate: 0,
        avgClickRate: 0,
        totalEmailsSent: 0
    })
    const [campaigns, setCampaigns] = useState<CampaignStat[]>([])
    const [eventData, setEventData] = useState<any[]>([])
    const [engagementData, setEngagementData] = useState<any[]>([])

    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted) {
            fetchAnalytics()
        }
    }, [mounted])

    async function fetchAnalytics() {
        setLoading(true)
        try {
            // 1. KPI Queries
            const { count: contactsCount } = await supabase
                .from('contacts')
                .select('*', { count: 'exact', head: true })

            const { count: eventsCount } = await supabase
                .from('events')
                .select('*', { count: 'exact', head: true })

            const { count: campaignsCount } = await supabase
                .from('email_campaigns')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'sent')

            // 2. Fetch sent campaigns basic info
            const { data: campaignData } = await supabase
                .from('email_campaigns')
                .select('id, name, subject, status, sent_at, total_sent')
                .eq('status', 'sent')
                .order('sent_at', { ascending: false })
                .limit(10)

            // 3. Fetch actual event counts from email_events table
            const { data: allEvents } = await supabase
                .from('email_events')
                .select('campaign_id, contact_id, event_type')

            // Calculate per-campaign stats from events
            const campaignStats = new Map<string, { opens: number, clicks: number, uniqueOpens: Set<string>, uniqueClicks: Set<string> }>()
            for (const event of allEvents || []) {
                if (!campaignStats.has(event.campaign_id)) {
                    campaignStats.set(event.campaign_id, { opens: 0, clicks: 0, uniqueOpens: new Set(), uniqueClicks: new Set() })
                }
                const stats = campaignStats.get(event.campaign_id)!
                if (event.event_type === 'opened') {
                    stats.opens++
                    if (event.contact_id) stats.uniqueOpens.add(event.contact_id)
                }
                if (event.event_type === 'clicked') {
                    stats.clicks++
                    if (event.contact_id) stats.uniqueClicks.add(event.contact_id)
                }
            }

            // Merge stats into campaign data
            const campaignsWithStats = (campaignData || []).map(c => {
                const eventStats = campaignStats.get(c.id)
                return {
                    ...c,
                    total_opens: eventStats?.uniqueOpens.size || 0,
                    total_clicks: eventStats?.uniqueClicks.size || 0,
                    total_bounces: 0
                }
            })

            setCampaigns(campaignsWithStats)

            // 4. Calculate aggregate stats from live event data
            let totalOpens = 0
            let totalClicks = 0
            let totalSent = 0
            for (const c of campaignsWithStats) {
                totalOpens += c.total_opens || 0
                totalClicks += c.total_clicks || 0
                totalSent += c.total_sent || 0
            }
            const avgOpenRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0
            const avgClickRate = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0

            setStats({
                totalContacts: contactsCount || 0,
                totalEvents: eventsCount || 0,
                totalCampaigns: campaignsCount || 0,
                avgOpenRate,
                avgClickRate,
                totalEmailsSent: totalSent
            })

            // 4. Event attendance
            const { data: attendanceData } = await supabase
                .from('attendance')
                .select('status, event_id, events(name)')
                .limit(500)

            const eventMap = new Map<string, { name: string, registered: number, attended: number }>()
            for (const a of attendanceData || []) {
                const eventName = (a.events as any)?.name || 'Unknown'
                if (!eventMap.has(a.event_id)) {
                    eventMap.set(a.event_id, { name: eventName, registered: 0, attended: 0 })
                }
                const entry = eventMap.get(a.event_id)!
                entry.registered++
                if (a.status === 'checked_in') {
                    entry.attended++
                }
            }
            setEventData(Array.from(eventMap.values()).slice(0, 6))

            // 5. Engagement distribution
            const { data: contacts } = await supabase
                .from('contacts')
                .select('engagement_score')

            const engagementBuckets = { high: 0, medium: 0, low: 0, inactive: 0 }
            for (const c of contacts || []) {
                const score = c.engagement_score || 0
                if (score >= 80) engagementBuckets.high++
                else if (score >= 50) engagementBuckets.medium++
                else if (score >= 20) engagementBuckets.low++
                else engagementBuckets.inactive++
            }

            setEngagementData([
                { name: 'High', value: engagementBuckets.high, color: '#22c55e' },
                { name: 'Medium', value: engagementBuckets.medium, color: '#6366f1' },
                { name: 'Low', value: engagementBuckets.low, color: '#f59e0b' },
                { name: 'Inactive', value: engagementBuckets.inactive, color: '#ef4444' },
            ])

        } catch (e) {
            console.error('Analytics Error', e)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    async function handleRefresh() {
        setRefreshing(true)
        await fetchAnalytics()
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    <p className="text-slate-600 font-medium">Loading analytics...</p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <div className="p-8 space-y-8 max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
                            Analytics & Insights
                        </h1>
                        <p className="text-slate-500 mt-1">Track your campaign performance and engagement metrics</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </motion.div>

                {/* Premium KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Total Contacts"
                        value={stats.totalContacts.toLocaleString()}
                        subtitle="In your CRM"
                        icon={<Users className="w-6 h-6" />}
                        gradient="indigo"
                        delay={0}
                    />
                    <MetricCard
                        title="Emails Sent"
                        value={stats.totalEmailsSent.toLocaleString()}
                        subtitle="Across all campaigns"
                        icon={<Mail className="w-6 h-6" />}
                        gradient="purple"
                        delay={0.1}
                    />
                    <MetricCard
                        title="Avg Open Rate"
                        value={`${stats.avgOpenRate.toFixed(1)}%`}
                        subtitle="Industry avg: 21%"
                        icon={<Eye className="w-6 h-6" />}
                        gradient="blue"
                        trend={stats.avgOpenRate > 21 ? { value: 5, isPositive: true } : undefined}
                        delay={0.2}
                    />
                    <MetricCard
                        title="Click-to-Open"
                        value={`${stats.avgClickRate.toFixed(1)}%`}
                        subtitle="Engagement rate"
                        icon={<MousePointer className="w-6 h-6" />}
                        gradient="green"
                        delay={0.3}
                    />
                </div>

                {/* Campaign Performance Table */}
                {campaigns.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-indigo-500" />
                                            Campaign Performance
                                        </CardTitle>
                                        <CardDescription>Your recent email campaigns and their metrics</CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                                        {campaigns.length} campaigns
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50/50">
                                            <tr className="text-left">
                                                <th className="py-4 px-6 font-semibold text-slate-700">Campaign</th>
                                                <th className="py-4 px-4 font-semibold text-slate-700 text-center">Sent</th>
                                                <th className="py-4 px-4 font-semibold text-slate-700 text-center">Opens</th>
                                                <th className="py-4 px-4 font-semibold text-slate-700 text-center">Clicks</th>
                                                <th className="py-4 px-4 font-semibold text-slate-700 text-center">Open Rate</th>
                                                <th className="py-4 px-4 font-semibold text-slate-700 text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {campaigns.map((c, index) => {
                                                const openRate = c.total_sent && c.total_sent > 0
                                                    ? ((c.total_opens || 0) / c.total_sent * 100).toFixed(1)
                                                    : 0
                                                return (
                                                    <motion.tr
                                                        key={c.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.5 + index * 0.05 }}
                                                        className="hover:bg-slate-50/80 transition-colors group"
                                                    >
                                                        <td className="py-4 px-6">
                                                            <div>
                                                                <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                                    {c.name}
                                                                </p>
                                                                <p className="text-sm text-slate-500 truncate max-w-xs">{c.subject}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-center">
                                                            <span className="font-semibold text-slate-700">{c.total_sent || 0}</span>
                                                        </td>
                                                        <td className="py-4 px-4 text-center">
                                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-semibold">
                                                                {c.total_opens || 0}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-4 px-4 text-center">
                                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-semibold">
                                                                {c.total_clicks || 0}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-4 px-4 text-center">
                                                            <span className={`font-bold ${Number(openRate) >= 30 ? 'text-emerald-600' :
                                                                Number(openRate) >= 15 ? 'text-amber-600' : 'text-rose-600'
                                                                }`}>
                                                                {openRate}%
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 text-right">
                                                            <Link href={`/admin/campaigns/${c.id}/analytics`}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    View <ArrowRight className="w-4 h-4 ml-1" />
                                                                </Button>
                                                            </Link>
                                                        </td>
                                                    </motion.tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Charts Grid */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Event Attendance */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <Card className="border-0 shadow-xl shadow-slate-200/50 h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-violet-500" />
                                    Event Attendance
                                </CardTitle>
                                <CardDescription>Registration vs check-in rates</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                {eventData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={eventData} barGap={8}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                                    border: 'none'
                                                }}
                                            />
                                            <Bar dataKey="registered" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Registered" />
                                            <Bar dataKey="attended" fill="#22c55e" radius={[6, 6, 0, 0]} name="Attended" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="text-center">
                                            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                            <p className="text-slate-500">No event data yet</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Engagement Health */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <Card className="border-0 shadow-xl shadow-slate-200/50 h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-orange-500" />
                                    Engagement Health
                                </CardTitle>
                                <CardDescription>Contact engagement score distribution</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                {engagementData.some(d => d.value > 0) ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={engagementData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {engagementData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                                    border: 'none'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="text-center">
                                            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                            <p className="text-slate-500">No engagement data yet</p>
                                        </div>
                                    </div>
                                )}
                                {/* Legend */}
                                <div className="flex justify-center gap-6 mt-4">
                                    {engagementData.map((entry) => (
                                        <div key={entry.name} className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: entry.color }}
                                            />
                                            <span className="text-sm text-slate-600">{entry.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Quick Stats Footer */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    {[
                        { label: 'Total Events', value: stats.totalEvents, icon: Calendar, color: 'violet' },
                        { label: 'Campaigns Sent', value: stats.totalCampaigns, icon: Mail, color: 'blue' },
                        { label: 'Total Opens', value: campaigns.reduce((sum, c) => sum + (c.total_opens || 0), 0), icon: Eye, color: 'emerald' },
                        { label: 'Total Clicks', value: campaigns.reduce((sum, c) => sum + (c.total_clicks || 0), 0), icon: MousePointer, color: 'orange' },
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.9 + index * 0.05 }}
                            className="bg-white rounded-xl p-4 shadow-lg shadow-slate-200/50 flex items-center gap-4"
                        >
                            <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">
                                    <AnimatedCounter value={stat.value} delay={1 + index * 0.1} />
                                </p>
                                <p className="text-xs text-slate-500">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    )
}
