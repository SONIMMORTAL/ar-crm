'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function TrackingDebugger() {
    const [events, setEvents] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [counts, setCounts] = useState<any>(null)
    const [baseUrl, setBaseUrl] = useState<string>('')

    // Get the actual runtime URL (not the build-time env var)
    useEffect(() => {
        setBaseUrl(window.location.origin)
    }, [])

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const checkTable = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase
                .from('email_events')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(10)

            if (error) {
                setError(`Table Check Failed: ${error.message} (${error.code})`)
                return
            }

            setEvents(data || [])

            const { count } = await supabase
                .from('email_events')
                .select('*', { count: 'exact', head: true })

            setCounts(count)

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const pixelUrl = baseUrl ? `${baseUrl}/api/track/open?cid=TEST_CAMPAIGN&uid=TEST_USER` : ''

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold">Tracking Debugger</h1>

            <div className="bg-slate-900 p-4 rounded-lg space-y-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={checkTable}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Checking...' : 'Check email_events Table'}
                    </button>
                </div>

                {error && (
                    <div className="p-4 bg-red-900/50 border border-red-500 rounded text-red-100">
                        <h3 className="font-bold">Error Detected:</h3>
                        <p>{error}</p>
                        {error.includes('relation "email_events" does not exist') && (
                            <div className="mt-2 text-yellow-300">
                                ⚠️ Table missing! You need to run the migration 007.
                            </div>
                        )}
                    </div>
                )}

                {counts !== null && (
                    <div className="p-4 bg-green-900/30 border border-green-500 rounded text-green-100">
                        <h3 className="font-bold">Success! Table Exists.</h3>
                        <p>Total Events: {counts}</p>
                        <p className="text-sm opacity-70 mt-1">If events &gt; 0, tracking is recording.</p>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Latest Events</h2>
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-800 text-slate-300">
                            <tr>
                                <th className="p-3">Time</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Campaign</th>
                                <th className="p-3">Contact</th>
                                <th className="p-3">Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((e) => (
                                <tr key={e.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                                    <td className="p-3">{new Date(e.timestamp).toLocaleString()}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold
                                            ${e.event_type === 'opened' ? 'bg-green-500/20 text-green-400' :
                                                e.event_type === 'sent' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20'}
                                        `}>
                                            {e.event_type}
                                        </span>
                                    </td>
                                    <td className="p-3 font-mono text-xs">{e.campaign_id?.substring(0, 8)}...</td>
                                    <td className="p-3 font-mono text-xs">{e.contact_id?.substring(0, 8)}...</td>
                                    <td className="p-3 font-mono text-xs max-w-xs truncate">
                                        {JSON.stringify(e.event_data)}
                                    </td>
                                </tr>
                            ))}
                            {events.length === 0 && !error && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        No events found or check not run.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-lg space-y-4">
                <h2 className="text-xl font-semibold">Pixel Tester</h2>
                <p className="text-sm text-slate-400">
                    Click the link below to verify if the tracking endpoint is reachable.
                    This simulates an email open.
                </p>
                <div className="p-3 bg-black rounded border border-slate-700 font-mono text-xs break-all">
                    {baseUrl ? (
                        <a
                            href={pixelUrl}
                            target="_blank"
                            className="text-blue-400 hover:underline"
                        >
                            {pixelUrl}
                        </a>
                    ) : (
                        <span className="text-slate-500">Loading URL...</span>
                    )}
                </div>
                <p className="text-xs text-slate-500">
                    After clicking, check the table above. You should see a new 'opened' event for 'TEST_CAMPAIGN'.
                    (Refresh the list using the 'Check email_events Table' button).
                </p>
            </div>

            <div className="p-4 text-xs text-slate-500 font-mono space-y-1">
                <div>Runtime URL: <span className="text-green-400">{baseUrl || 'detecting...'}</span></div>
                <div>Env Var URL: <span className="text-yellow-400">{process.env.NEXT_PUBLIC_APP_URL || '(not set)'}</span></div>
                <div className="mt-2 text-yellow-500">
                    If counts &gt; 0 but analytics is 0%, check RLS policies.
                </div>
            </div>
        </div>
    )
}
