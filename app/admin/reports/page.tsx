'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, Download, Loader2, FileSpreadsheet, BarChart3, Users, Calendar, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'


export default function ReportsPage() {
    const [generating, setGenerating] = useState<string | null>(null)
    const supabase = createClient()

    const generatePDF = async () => {
        setGenerating('pdf')
        try {
            const { data: events } = await supabase
                .from('events')
                .select('name, event_date, location, capacity')
                .order('event_date', { ascending: false })

            const doc = new jsPDF()
            doc.text('Event Performance Report', 14, 20)

            if (events) {
                autoTable(doc, {
                    head: [['Event Name', 'Date', 'Location', 'Capacity']],
                    body: events.map(e => [e.name, new Date(e.event_date).toLocaleDateString(), e.location || 'N/A', e.capacity || '-']),
                    startY: 30
                })
            }

            doc.save('events-report.pdf')

        } catch (e) {
            console.error(e)
            alert('Failed to generate PDF')
        } finally {
            setGenerating(null)
        }
    }

    const generateCSV = async () => {
        setGenerating('csv')
        try {
            const { data: contacts } = await supabase
                .from('contacts')
                .select('id, email, first_name, last_name, engagement_score')

            if (contacts) {
                const csv = Papa.unparse(contacts)
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.setAttribute('href', url)
                link.setAttribute('download', 'contacts_export.csv')
                link.click()
            }

        } catch (e) {
            console.error(e)
            alert('Failed to generate CSV')
        } finally {
            setGenerating(null)
        }
    }

    const reports = [
        {
            title: 'Event Performance PDF',
            description: 'Download a printable summary of all past and upcoming events with attendance data.',
            icon: Calendar,
            color: 'violet',
            action: generatePDF,
            actionLabel: 'Download PDF',
            type: 'pdf'
        },
        {
            title: 'Contact Export CSV',
            description: 'Export your full contact list including engagement scores and metadata.',
            icon: Users,
            color: 'indigo',
            action: generateCSV,
            actionLabel: 'Download CSV',
            type: 'csv'
        },
        {
            title: 'Campaign Analytics',
            description: 'View detailed analytics for all your email campaigns and engagement metrics.',
            icon: BarChart3,
            color: 'blue',
            action: () => window.location.href = '/admin/analytics',
            actionLabel: 'View Analytics',
            type: 'link'
        },
        {
            title: 'Engagement Report',
            description: 'Generate a comprehensive report on contact engagement trends over time.',
            icon: TrendingUp,
            color: 'emerald',
            action: () => { },
            actionLabel: 'Coming Soon',
            type: 'disabled'
        }
    ]

    return (
        <div className="min-h-screen p-8 space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    Reports Center
                </h1>
                <p className="text-slate-500 mt-2">Generate and download reports for your CRM data</p>
            </motion.div>

            {/* Reports Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {reports.map((report, index) => (
                    <motion.div
                        key={report.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                    >
                        <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden h-full hover:shadow-2xl transition-shadow">
                            <div className={`h-1 bg-gradient-to-r from-${report.color}-500 to-${report.color}-600`} />
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl bg-${report.color}-100 shadow-lg shadow-${report.color}-500/10`}>
                                        <report.icon className={`w-6 h-6 text-${report.color}-600`} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{report.title}</CardTitle>
                                        <CardDescription className="mt-1">{report.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={report.action}
                                    disabled={generating === report.type || report.type === 'disabled'}
                                    variant={report.type === 'link' ? 'outline' : 'default'}
                                    className={`w-full ${report.type !== 'link' && report.type !== 'disabled' ? `bg-gradient-to-r from-${report.color}-500 to-${report.color}-600 shadow-lg shadow-${report.color}-500/20` : ''}`}
                                >
                                    {generating === report.type ? (
                                        <Loader2 className="animate-spin mr-2 w-4 h-4" />
                                    ) : report.type === 'csv' || report.type === 'pdf' ? (
                                        <Download className="mr-2 w-4 h-4" />
                                    ) : null}
                                    {report.actionLabel}
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Quick tip */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <Card className="border-0 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                    <CardContent className="flex items-center gap-4 py-6">
                        <div className="p-3 rounded-xl bg-white/10">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold">Pro Tip: Schedule Regular Exports</h3>
                            <p className="text-slate-400 text-sm">Download weekly contact exports to keep your backup data fresh and ready for external analysis.</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
