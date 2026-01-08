'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Upload, Loader2, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'

export function ImportContactsDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [stats, setStats] = useState<{ total: number, valid: number } | null>(null)
    const [contacts, setContacts] = useState<any[]>([])
    const [error, setError] = useState('')

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setError('')
        setLoading(true)

        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const data = results.data
                const valid = data.filter((row: any) => row.email && row.email.includes('@'))

                setContacts(valid)
                setStats({ total: data.length, valid: valid.length })
                setLoading(false)
            },
            error: (err) => {
                setError('Failed to parse CSV: ' + err.message)
                setLoading(false)
            }
        })
    }

    const handleImport = async () => {
        if (contacts.length === 0) return

        setLoading(true)
        try {
            const res = await fetch('/api/contacts/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contacts })
            })

            if (!res.ok) {
                const json = await res.json()
                throw new Error(json.error || 'Import Failed')
            }

            const result = await res.json()
            alert(`Imported ${result.imported} contacts successfully!`)

            setOpen(false)
            setContacts([])
            setStats(null)
            onSuccess()

        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" /> Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Import Contacts</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with headers: unique <code>email</code>, <code>first_name</code>, <code>last_name</code>, <code>phone</code>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!stats ? (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-slate-50 transition-colors relative">
                            <input
                                type="file"
                                accept=".csv"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                            />
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Upload className="w-8 h-8" />
                                <span className="text-sm font-medium">Click to upload or drag & drop</span>
                                <span className="text-xs">CSV files only</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-50 p-4 rounded-md flex items-center gap-3 text-green-700">
                                <FileText className="w-5 h-5" />
                                <div>
                                    <p className="font-medium">File Parsed Successfully</p>
                                    <p className="text-sm opacity-90">Found {stats.valid} valid contacts out of {stats.total} rows.</p>
                                </div>
                                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { setStats(null); setContacts([]); }}>
                                    Change
                                </Button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 p-3 rounded-md flex items-center gap-2 text-red-600 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleImport} disabled={loading || contacts.length === 0}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Import {contacts.length > 0 ? `(${contacts.length})` : ''}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
