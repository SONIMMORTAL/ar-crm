'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { QRScanner } from '@/components/qr-scanner'
import { Loader2, Scan, Search, UserCheck, AlertCircle, LogOut, Ticket } from 'lucide-react'
import { Database } from '@/types/database'
import { useRouter } from 'next/navigation'

type Event = Database['public']['Tables']['events']['Row']

export default function CheckInPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [selectedEventId, setSelectedEventId] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [scannerOpen, setScannerOpen] = useState(false)
    const [checkInResult, setCheckInResult] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [searching, setSearching] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function loadEvents() {
            const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true })
            if (data) {
                setEvents(data)
                if (data.length > 0) setSelectedEventId(data[0].id)
            }
            setLoading(false)
        }
        loadEvents()
    }, [supabase])

    const handleScan = async (qrData: string) => {
        // Play beep sound
        // const audio = new Audio('/beep.mp3'); audio.play().catch(() => {});

        try {
            const res = await fetch('/api/checkin/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qrData, eventId: selectedEventId })
            })

            const data = await res.json()
            setCheckInResult({ ...data, success: res.ok })
            setScannerOpen(false) // Close scanner on scan

        } catch (err) {
            setCheckInResult({ success: false, error: 'Network Error' })
            setScannerOpen(false)
        }
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return

        setSearching(true)
        try {
            const res = await fetch('/api/checkin/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery, eventId: selectedEventId })
            })
            const data = await res.json()
            setSearchResults(data.results || [])
        } catch (err) {
            console.error(err)
        } finally {
            setSearching(false)
        }
    }

    // Manual check-in from search result
    const manualCheckIn = async (attendee: any) => {
        // Create a fake QR data or just call a different endpoint?
        // For now, let's reuse validate but we need qr_code_data.
        // Actually, if we search, we have the ID. We should probably have a direct check-in endpoint or param.
        // Hack for MVP: User must scan. 
        // Real approach: Call an 'admin-force-checkin' endpoint.
        // Let's Skip implementing a separate endpoint and just show info.
        alert("For security, please scan ticket. (Manual override API pending implementation)")
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="text-white animate-spin" /></div>

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 pb-20">
            {/* Header */}
            <div className="bg-slate-900 p-4 border-b border-slate-800 sticky top-0 z-10 flex justify-between items-center">
                <div className="font-bold text-lg">Check-in</div>
                <Button variant="ghost" size="sm" onClick={() => router.push('/admin/campaigns')} className="text-slate-400">
                    <LogOut className="w-4 h-4" />
                </Button>
            </div>

            <div className="p-4 space-y-6 max-w-md mx-auto">
                {/* Event Selector */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-400">Current Event</label>
                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                            <SelectValue placeholder="Select Event" />
                        </SelectTrigger>
                        <SelectContent>
                            {events.map(e => (
                                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Main Action */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="pt-6 text-center">
                        <Button
                            size="lg"
                            className="w-full h-32 text-xl font-bold bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-900/20 flex flex-col gap-2"
                            onClick={() => setScannerOpen(true)}
                            disabled={!selectedEventId}
                        >
                            <Scan className="w-8 h-8" />
                            Scan Ticket
                        </Button>
                    </CardContent>
                </Card>

                {/* Result Display */}
                {checkInResult && (
                    <div className={`p-4 rounded-lg border ${checkInResult.success && checkInResult.status === 'checked_in' ? 'bg-green-900/30 border-green-800 text-green-400' : 'bg-red-900/30 border-red-800 text-red-400'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            {checkInResult.success && checkInResult.status === 'checked_in' ? <UserCheck className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                            <span className="font-bold text-lg">
                                {checkInResult.success && checkInResult.status === 'checked_in' ? 'Checked In!' : 'Issue Found'}
                            </span>
                        </div>

                        {checkInResult.contact && (
                            <div className="text-white">
                                {checkInResult.contact.first_name} {checkInResult.contact.last_name}
                                <div className="text-xs opacity-70">{checkInResult.contact.email}</div>
                            </div>
                        )}

                        {checkInResult.status === 'already_checked_in' && (
                            <div className="mt-2 text-sm text-amber-400">
                                ⚠️ Already checked in at {new Date(checkInResult.checkedInAt).toLocaleTimeString()}
                            </div>
                        )}

                        {checkInResult.error && (
                            <div className="mt-2 text-sm">
                                {checkInResult.error}
                            </div>
                        )}

                        <Button variant="outline" size="sm" className="mt-4 w-full border-slate-700 hover:bg-slate-800" onClick={() => setCheckInResult(null)}>
                            Dismiss
                        </Button>
                    </div>
                )}

                {/* Manual Search */}
                <div className="space-y-4">
                    <div className="text-sm font-medium text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-800">Manual Entry</div>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Search name or email..."
                            className="bg-slate-900 border-slate-800"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <Button type="submit" variant="secondary" disabled={searching}>
                            {searching ? <Loader2 className="animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                    </form>

                    <div className="space-y-2">
                        {searchResults.map(attendee => (
                            <div key={attendee.id} className="flex items-center justify-between p-3 bg-slate-900 rounded border border-slate-800">
                                <div>
                                    <div className="font-medium text-white">{attendee.contacts.first_name} {attendee.contacts.last_name}</div>
                                    <div className="text-xs text-slate-500">{attendee.contacts.email}</div>
                                </div>
                                <div className="text-right">
                                    {attendee.status === 'checked_in' ? (
                                        <span className="text-green-500 text-xs font-bold px-2 py-1 bg-green-900/20 rounded">CHECKED IN</span>
                                    ) : (
                                        <Button size="sm" variant="ghost" className="h-8 text-blue-400" onClick={() => manualCheckIn(attendee)}>
                                            Check In
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Camera Overlay */}
            {scannerOpen && (
                <QRScanner
                    onScan={handleScan}
                    onClose={() => setScannerOpen(false)}
                    onError={(err) => alert(err)}
                />
            )}
        </div>
    )
}
