'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/ui/metric-card'
import Link from 'next/link'
import {
    ArrowRight, Users, Calendar, Mail, Plus, TrendingUp,
    BarChart3, Sparkles, Clock, CheckCircle, Zap, Eye, ArrowUpRight
} from 'lucide-react'

interface DashboardStats {
    contacts: number
    events: number
    campaigns: number
    recentOpens: number
}

// Skeleton loader component
function Skeleton({ className }: { className?: string }) {
    return <div className={`skeleton ${className}`} />
}

export default function DashboardPage() {
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<DashboardStats>({
        contacts: 0,
        events: 0,
        campaigns: 0,
        recentOpens: 0
    })
    const [recentCampaigns, setRecentCampaigns] = useState<any[]>([])
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted) {
            fetchDashboardData()
        }
    }, [mounted])

    async function fetchDashboardData() {
        setLoading(true)
        const [contactsRes, eventsRes, campaignsRes] = await Promise.all([
            supabase.from('contacts').select('*', { count: 'exact', head: true }),
            supabase.from('events').select('*', { count: 'exact', head: true }),
            supabase.from('email_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'sent')
        ])

        const { data: campaigns } = await supabase
            .from('email_campaigns')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(4)

        const { data: events } = await supabase
            .from('events')
            .select('*')
            .gte('date', new Date().toISOString())
            .order('date', { ascending: true })
            .limit(3)

        // Query email_events for accurate Total Opens count
        const { data: openEvents } = await supabase
            .from('email_events')
            .select('contact_id')
            .eq('event_type', 'opened')

        // Count unique contacts who opened any email
        const uniqueOpeners = new Set(openEvents?.map(e => e.contact_id) || [])
        const totalOpens = uniqueOpeners.size

        setStats({
            contacts: contactsRes.count || 0,
            events: eventsRes.count || 0,
            campaigns: campaignsRes.count || 0,
            recentOpens: totalOpens
        })
        setRecentCampaigns(campaigns || [])
        setUpcomingEvents(events || [])
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-mesh">
            <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-8">
                {/* Welcome Header */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-end justify-between"
                >
                    <div>
                        <p className="text-[13px] font-medium text-slate-500 tracking-wide mb-1">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                        <h1 className="text-[32px] font-bold text-slate-900 tracking-[-0.02em] leading-tight">
                            Welcome back
                        </h1>
                        <p className="text-[15px] text-slate-500 mt-1">Here's an overview of your CRM activity</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" asChild className="h-10 px-4 text-[13px] font-medium shadow-premium-sm hover:shadow-premium border-slate-200/80 transition-all">
                            <Link href="/admin/campaigns/new">
                                <Plus className="w-4 h-4 mr-2" /> New Campaign
                            </Link>
                        </Button>
                        <Button asChild className="h-10 px-5 text-[13px] font-medium bg-gradient-to-r from-indigo-600 to-violet-600 btn-premium">
                            <Link href="/admin/analytics">
                                <BarChart3 className="w-4 h-4 mr-2" /> Analytics
                            </Link>
                        </Button>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {loading ? (
                        <>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="premium-card p-5">
                                    <Skeleton className="w-10 h-10 rounded-xl mb-4" />
                                    <Skeleton className="w-16 h-8 mb-2" />
                                    <Skeleton className="w-24 h-4" />
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            <MetricCard
                                title="Total Contacts"
                                value={stats.contacts.toLocaleString()}
                                subtitle="In your CRM"
                                icon={<Users className="w-5 h-5" />}
                                gradient="indigo"
                                delay={0}
                            />
                            <MetricCard
                                title="Active Events"
                                value={stats.events.toString()}
                                subtitle="Scheduled"
                                icon={<Calendar className="w-5 h-5" />}
                                gradient="purple"
                                delay={0.05}
                            />
                            <MetricCard
                                title="Campaigns Sent"
                                value={stats.campaigns.toString()}
                                subtitle="Email campaigns"
                                icon={<Mail className="w-5 h-5" />}
                                gradient="blue"
                                delay={0.1}
                            />
                            <MetricCard
                                title="Total Opens"
                                value={stats.recentOpens.toLocaleString()}
                                subtitle="Across all campaigns"
                                icon={<Eye className="w-5 h-5" />}
                                gradient="green"
                                delay={0.15}
                            />
                        </>
                    )}
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="premium-card h-full">
                            <div className="p-5 pb-4 border-b border-slate-100/80">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50">
                                        <Zap className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[15px] text-slate-900 tracking-[-0.01em]">Quick Actions</h3>
                                        <p className="text-[12px] text-slate-500">Get things done faster</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                {[
                                    { href: '/admin/campaigns/new', icon: Mail, label: 'Create Email Campaign', description: 'Send bulk emails', color: 'indigo' },
                                    { href: '/admin/events', icon: Calendar, label: 'Manage Events', description: 'View & edit events', color: 'violet' },
                                    { href: '/admin/contacts', icon: Users, label: 'View Contacts', description: 'Browse your CRM', color: 'blue' },
                                ].map((action, i) => (
                                    <motion.div
                                        key={action.href}
                                        whileHover={{ x: 4 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <Link href={action.href}>
                                            <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50/80 transition-colors cursor-pointer group">
                                                <div className={`p-2.5 rounded-xl bg-gradient-to-br from-${action.color}-500 to-${action.color}-600`}
                                                    style={{ boxShadow: `0 4px 12px rgba(99, 102, 241, 0.2)` }}
                                                >
                                                    <action.icon className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-[13px] text-slate-800 group-hover:text-indigo-600 transition-colors tracking-[-0.01em]">
                                                        {action.label}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">{action.description}</p>
                                                </div>
                                                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Recent Campaigns */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="premium-card h-full">
                            <div className="p-5 pb-4 border-b border-slate-100/80">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200/50">
                                        <Mail className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[15px] text-slate-900 tracking-[-0.01em]">Recent Campaigns</h3>
                                        <p className="text-[12px] text-slate-500">Latest email activity</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 space-y-1.5">
                                {loading ? (
                                    <>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex items-center gap-3 p-3">
                                                <Skeleton className="w-2 h-2 rounded-full" />
                                                <div className="flex-1">
                                                    <Skeleton className="w-32 h-4 mb-1.5" />
                                                    <Skeleton className="w-20 h-3" />
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : recentCampaigns.length > 0 ? recentCampaigns.map((campaign, i) => (
                                    <motion.div
                                        key={campaign.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.05 }}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50/80 transition-colors group"
                                    >
                                        <div className={`w-2 h-2 rounded-full ${campaign.status === 'sent' ? 'bg-emerald-500' :
                                            campaign.status === 'draft' ? 'bg-slate-300' : 'bg-amber-500'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-[13px] text-slate-700 truncate tracking-[-0.01em]">{campaign.name}</p>
                                            <p className="text-[11px] text-slate-400">{campaign.status} • {campaign.total_sent || 0} sent</p>
                                        </div>
                                        {campaign.status === 'sent' && (
                                            <Link href={`/admin/campaigns/${campaign.id}/analytics`}>
                                                <Button variant="ghost" size="sm" className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                                                </Button>
                                            </Link>
                                        )}
                                    </motion.div>
                                )) : (
                                    <p className="text-[13px] text-slate-400 text-center py-8">No campaigns yet</p>
                                )}
                            </div>
                            <div className="p-4 pt-0">
                                <Link href="/admin/campaigns">
                                    <Button variant="ghost" className="w-full h-9 text-[12px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50 font-medium">
                                        View All Campaigns <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                    {/* Upcoming Events */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="premium-card h-full">
                            <div className="p-5 pb-4 border-b border-slate-100/80">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200/50">
                                        <Calendar className="w-4 h-4 text-violet-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[15px] text-slate-900 tracking-[-0.01em]">Upcoming Events</h3>
                                        <p className="text-[12px] text-slate-500">What's coming up</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                {loading ? (
                                    <>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex items-center gap-3 p-3">
                                                <Skeleton className="w-10 h-10 rounded-lg" />
                                                <div className="flex-1">
                                                    <Skeleton className="w-32 h-4 mb-1.5" />
                                                    <Skeleton className="w-20 h-3" />
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : upcomingEvents.length > 0 ? upcomingEvents.map((event, i) => (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.35 + i * 0.05 }}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50/80 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold"
                                            style={{ boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)' }}
                                        >
                                            {new Date(event.date || event.event_date).getDate()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-[13px] text-slate-700 truncate tracking-[-0.01em]">{event.name}</p>
                                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(event.date || event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <p className="text-[13px] text-slate-400 text-center py-8">No upcoming events</p>
                                )}
                            </div>
                            <div className="p-4 pt-0">
                                <Link href="/admin/events">
                                    <Button variant="ghost" className="w-full h-9 text-[12px] text-violet-600 hover:text-violet-700 hover:bg-violet-50/50 font-medium">
                                        View All Events <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Pro Tips Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6"
                        style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.25)' }}
                    >
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <svg className="w-full h-full" viewBox="0 0 400 200">
                                <defs>
                                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <circle cx="1" cy="1" r="1" fill="white" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                            </svg>
                        </div>
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-white/15 backdrop-blur-sm">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-[15px] tracking-[-0.01em]">Pro Tip: Boost Your Open Rates</h3>
                                    <p className="text-white/70 text-[13px] mt-0.5">Send campaigns between 10am-2pm for best engagement</p>
                                </div>
                            </div>
                            <Button className="bg-white text-indigo-600 hover:bg-white/90 h-9 px-4 text-[12px] font-medium shadow-lg">
                                Learn More <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
