'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
    Loader2, Plus, ExternalLink, Calendar, MapPin, Users,
    Clock, CheckCircle, ArrowRight, Sparkles
} from 'lucide-react'

export default function EventsPage() {
    const [mounted, setMounted] = useState(false)
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted) {
            loadEvents()
        }
    }, [mounted])

    async function loadEvents() {
        setLoading(true)
        const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true })
        if (data) setEvents(data)
        setLoading(false)
    }

    const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date())
    const pastEvents = events.filter(e => new Date(e.event_date) < new Date())

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
                        Events
                    </h1>
                    <p className="text-slate-500 mt-1">Manage your events and track attendance</p>
                </div>
                <Button className="bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                    <Plus className="w-4 h-4 mr-2" /> New Event
                </Button>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Events', value: events.length, icon: Calendar, color: 'violet' },
                    { label: 'Upcoming', value: upcomingEvents.length, icon: Clock, color: 'emerald' },
                    { label: 'Past Events', value: pastEvents.length, icon: CheckCircle, color: 'slate' },
                    {
                        label: 'This Month', value: events.filter(e => {
                            const d = new Date(e.event_date)
                            const now = new Date()
                            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                        }).length, icon: Sparkles, color: 'amber'
                    },
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

            {/* Events Grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                    </div>
                ) : events.length > 0 ? (
                    <>
                        {/* Upcoming Events */}
                        {upcomingEvents.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-emerald-500" />
                                    Upcoming Events
                                </h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {upcomingEvents.map((event, index) => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{ scale: 1.02, y: -4 }}
                                        >
                                            <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden group hover:shadow-2xl transition-all">
                                                <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-600" />
                                                <CardHeader>
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <CardTitle className="group-hover:text-violet-600 transition-colors">
                                                                {event.name}
                                                            </CardTitle>
                                                            {event.description && (
                                                                <CardDescription className="mt-1 line-clamp-2">
                                                                    {event.description}
                                                                </CardDescription>
                                                            )}
                                                        </div>
                                                        <Badge className="bg-emerald-100 text-emerald-700">Upcoming</Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                                        <Calendar className="w-4 h-4 text-violet-500" />
                                                        <span>{new Date(event.event_date).toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: 'numeric',
                                                            minute: '2-digit'
                                                        })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                                        <MapPin className="w-4 h-4 text-violet-500" />
                                                        <span>{event.location || 'Online'}</span>
                                                    </div>
                                                    <div className="flex gap-2 pt-2">
                                                        <Link href={`/register/${event.slug}`} target="_blank" className="flex-1">
                                                            <Button variant="outline" size="sm" className="w-full group-hover:border-violet-300">
                                                                <ExternalLink className="w-4 h-4 mr-2" /> Register
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/admin/events/${event.id}/checkin`}>
                                                            <Button size="sm" className="bg-gradient-to-r from-violet-500 to-purple-600">
                                                                <Users className="w-4 h-4 mr-1" /> Check-in
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Past Events */}
                        {pastEvents.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-slate-400" />
                                    Past Events
                                </h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {pastEvents.slice(0, 6).map((event, index) => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            <Card className="border-0 shadow-lg shadow-slate-200/50 opacity-75 hover:opacity-100 transition-opacity">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-slate-700">{event.name}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <Card className="border-0 shadow-xl shadow-slate-200/50">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 mb-4">
                                <Calendar className="w-10 h-10 text-violet-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-2">No events yet</h3>
                            <p className="text-slate-500 mb-6">Create your first event to get started</p>
                            <Button className="bg-gradient-to-r from-violet-500 to-purple-600">
                                <Plus className="w-4 h-4 mr-2" /> Create Event
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </motion.div>
        </div>
    )
}
