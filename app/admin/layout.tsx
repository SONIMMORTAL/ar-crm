import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, Calendar, Mail, Settings, LogOut } from 'lucide-react'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="font-bold text-xl">AR CRM</h1>
                    <p className="text-xs text-slate-400 mt-1">Admin Dashboard</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                    </Link>
                    <Link href="/admin/contacts" className="flex items-center gap-3 px-4 py-3 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                        <Users className="w-5 h-5" /> Contacts
                    </Link>
                    <Link href="/admin/events" className="flex items-center gap-3 px-4 py-3 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                        <Calendar className="w-5 h-5" /> Events
                    </Link>
                    <Link href="/admin/campaigns" className="flex items-center gap-3 px-4 py-3 rounded-md bg-slate-800 text-white shadow-sm">
                        <Mail className="w-5 h-5" /> Campaigns
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                        <Settings className="w-5 h-5" /> Settings
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 px-4 py-2">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                            {user.email?.[0].toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-slate-50 overflow-auto">
                {children}
            </div>
        </div>
    )
}
