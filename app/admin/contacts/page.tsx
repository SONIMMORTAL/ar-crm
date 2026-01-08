'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Loader2, Trash2, Users, Search, Plus, Upload,
    Mail, TrendingUp, Star, MoreHorizontal, UserPlus
} from 'lucide-react'
import { AddContactDialog } from '@/components/contacts/add-contact-dialog'
import { ImportContactsDialog } from '@/components/contacts/import-contacts-dialog'

export default function ContactsPage() {
    const [mounted, setMounted] = useState(false)
    const [contacts, setContacts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [deleting, setDeleting] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [refresh, setRefresh] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted) {
            loadContacts()
        }
    }, [search, refresh, mounted])

    async function loadContacts() {
        setLoading(true)
        let query = supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(50)

        if (search) {
            query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
        }

        const { data } = await query
        if (data) {
            setContacts(data)
            setSelectedIds(new Set())
        }
        setLoading(false)
    }

    const handleDelete = async (id: string, email: string) => {
        if (!confirm(`Are you sure you want to delete ${email}?`)) return

        setDeleting(id)
        await supabase.from('attendance').delete().eq('contact_id', id)
        await supabase.from('email_events').delete().eq('contact_id', id)
        const { error } = await supabase.from('contacts').delete().eq('id', id)
        setDeleting(null)

        if (!error) {
            setRefresh(prev => prev + 1)
        } else {
            alert('Failed: ' + error.message)
        }
    }

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} contacts?`)) return

        setLoading(true)
        const ids = Array.from(selectedIds)

        await supabase.from('attendance').delete().in('contact_id', ids)
        await supabase.from('email_events').delete().in('contact_id', ids)
        const { error } = await supabase.from('contacts').delete().in('id', ids)

        if (error) {
            alert('Bulk delete failed: ' + error.message)
        } else {
            setRefresh(prev => prev + 1)
        }
        setLoading(false)
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === contacts.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(contacts.map(c => c.id)))
        }
    }

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedIds(newSet)
    }

    const getEngagementColor = (score: number) => {
        if (score >= 80) return 'bg-emerald-100 text-emerald-700'
        if (score >= 50) return 'bg-blue-100 text-blue-700'
        if (score >= 20) return 'bg-amber-100 text-amber-700'
        return 'bg-slate-100 text-slate-600'
    }

    const getEngagementLabel = (score: number) => {
        if (score >= 80) return 'High'
        if (score >= 50) return 'Medium'
        if (score >= 20) return 'Low'
        return 'New'
    }

    // Stats
    const highEngagement = contacts.filter(c => (c.engagement_score || 0) >= 80).length
    const totalContacts = contacts.length

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
                        Contacts
                    </h1>
                    <p className="text-slate-500 mt-1">Manage your contact database and engagement</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedIds.size > 0 && (
                        <Button
                            variant="destructive"
                            onClick={handleBulkDelete}
                            disabled={loading}
                            className="shadow-lg"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete {selectedIds.size}
                        </Button>
                    )}
                    <ImportContactsDialog onSuccess={() => setRefresh(prev => prev + 1)} />
                    <AddContactDialog onSuccess={() => setRefresh(prev => prev + 1)} />
                </div>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Contacts', value: totalContacts, icon: Users, color: 'indigo' },
                    { label: 'High Engagement', value: highEngagement, icon: Star, color: 'emerald' },
                    {
                        label: 'This Week', value: contacts.filter(c => {
                            const d = new Date(c.created_at)
                            const now = new Date()
                            return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000
                        }).length, icon: UserPlus, color: 'violet'
                    },
                    { label: 'With Email', value: contacts.filter(c => c.email).length, icon: Mail, color: 'blue' },
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

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-4"
            >
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-white border-slate-200"
                    />
                </div>
            </motion.div>

            {/* Contacts Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <CardContent className="p-0">
                        {loading && contacts.length === 0 ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50/80 border-b">
                                        <tr>
                                            <th className="p-4 w-[50px]">
                                                <Checkbox
                                                    checked={contacts.length > 0 && selectedIds.size === contacts.length}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className="p-4 font-semibold text-slate-700 text-left">Contact</th>
                                            <th className="p-4 font-semibold text-slate-700 text-left">Email</th>
                                            <th className="p-4 font-semibold text-slate-700 text-center">Engagement</th>
                                            <th className="p-4 font-semibold text-slate-700 text-left">Added</th>
                                            <th className="p-4 font-semibold text-slate-700 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <AnimatePresence>
                                            {contacts.map((contact, index) => (
                                                <motion.tr
                                                    key={contact.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ delay: index * 0.02 }}
                                                    className="hover:bg-slate-50/80 transition-colors group"
                                                >
                                                    <td className="p-4">
                                                        <Checkbox
                                                            checked={selectedIds.has(contact.id)}
                                                            onCheckedChange={() => toggleSelect(contact.id)}
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-indigo-500/20">
                                                                {(contact.first_name?.[0] || contact.email?.[0] || '?').toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-slate-900">
                                                                    {contact.first_name} {contact.last_name}
                                                                </p>
                                                                {contact.phone && (
                                                                    <p className="text-xs text-slate-500">{contact.phone}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-slate-600">{contact.email}</td>
                                                    <td className="p-4 text-center">
                                                        <Badge className={getEngagementColor(contact.engagement_score || 0)}>
                                                            {getEngagementLabel(contact.engagement_score || 0)} ({contact.engagement_score || 0})
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 text-slate-500 text-sm">
                                                        {new Date(contact.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => handleDelete(contact.id, contact.email)}
                                                            disabled={deleting === contact.id}
                                                        >
                                                            {deleting === contact.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                                {contacts.length === 0 && !loading && (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 mb-4">
                                            <Users className="w-10 h-10 text-indigo-500" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-900 mb-2">No contacts found</h3>
                                        <p className="text-slate-500 mb-6">Add or import contacts to get started</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
