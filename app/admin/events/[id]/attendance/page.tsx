'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client' // Client side for interactions
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, CheckCircle, XCircle, Search } from 'lucide-react'
import { useParams } from 'next/navigation'

export default function AttendancePage() {
    const params = useParams()
    const eventId = params.id as string
    const [loading, setLoading] = useState(true)
    const [attendees, setAttendees] = useState<any[]>([])
    const [stats, setStats] = useState({ total: 0, checkedIn: 0 })
    const [search, setSearch] = useState('')
    const supabase = createClient()

    const calculateStats = (data: any[]) => {
        const checkedIn = data.filter(a => a.status === 'checked_in').length
        setStats({ total: data.length, checkedIn })
    }

    const fetchAttendees = useCallback(async () => {
        setLoading(true)
        // Join attendance with contacts
        const { data, error } = await supabase
            .from('attendance')
            .select(`
                *,
                contacts (
                    first_name,
                    last_name,
                    email
                )
            `)
            .eq('event_id', eventId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error(error)
            alert('Failed to load attendees')
        } else {
            setAttendees(data || [])
            calculateStats(data || [])
        }
        setLoading(false)
    }, [eventId, supabase])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchAttendees()
    }, [fetchAttendees])

    const toggleCheckIn = async (attendanceId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'checked_in' ? 'registered' : 'checked_in'

        // Optimistic update
        setAttendees(prev => prev.map(a =>
            a.id === attendanceId ? { ...a, status: newStatus } : a
        ))
        calculateStats(attendees.map(a =>
            a.id === attendanceId ? { ...a, status: newStatus } : a
        ))

        const { error } = await supabase
            .from('attendance')
            .update({ status: newStatus })
            .eq('id', attendanceId)

        if (error) {
            alert('Update failed')
            fetchAttendees() // Revert
        }
    }

    const filteredAttendees = attendees.filter(a => {
        const term = search.toLowerCase()
        const c = a.contacts
        return c?.email.toLowerCase().includes(term) ||
            c?.first_name.toLowerCase().includes(term) ||
            c?.last_name.toLowerCase().includes(term)
    })

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Event Attendance</h1>
                    <p className="text-muted-foreground">Manage check-ins for this event.</p>
                </div>
                <div className="flex gap-4">
                    <Card className="p-4 bg-blue-50 border-blue-100">
                        <div className="text-2xl font-bold text-blue-700">{stats.checkedIn} / {stats.total}</div>
                        <div className="text-xs text-blue-600">Checked In</div>
                    </Card>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search attendees..."
                        className="pl-8"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={fetchAttendees} variant="outline" size="icon">
                    <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <div className="border rounded-lg bg-white overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-3 font-medium text-slate-500">Name</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Email</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                            <th className="px-6 py-3 font-medium text-slate-500 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredAttendees.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                    No attendees found.
                                </td>
                            </tr>
                        ) : (
                            filteredAttendees.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 font-medium">
                                        {record.contacts?.first_name} {record.contacts?.last_name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {record.contacts?.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.status === 'checked_in'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {record.status === 'checked_in' ? 'Checked In' : 'Registered'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button
                                            size="sm"
                                            variant={record.status === 'checked_in' ? "outline" : "default"}
                                            onClick={() => toggleCheckIn(record.id, record.status)}
                                        >
                                            {record.status === 'checked_in' ? 'Undo Check-in' : 'Check In'}
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
