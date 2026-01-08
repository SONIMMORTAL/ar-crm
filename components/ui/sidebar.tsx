'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard, Users, Calendar, Mail, Settings,
    FileText, ArrowLeftRight, BarChart3, Sparkles, Wrench, ChevronRight
} from 'lucide-react'

interface SidebarProps {
    userEmail?: string
}

const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/contacts', label: 'Contacts', icon: Users },
    { href: '/admin/events', label: 'Events', icon: Calendar },
    { href: '/admin/campaigns', label: 'Campaigns', icon: Mail },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/reports', label: 'Reports', icon: FileText },
    { href: '/admin/integrations', label: 'Integrations', icon: ArrowLeftRight },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
]

const devTools = [
    { href: '/admin/tools/tracking-debugger', label: 'Tracking Debugger', icon: BarChart3 },
    { href: '/admin/tools/email-debugger', label: 'Email Debugger', icon: Mail },
    { href: '/admin/tools/webhook-tester', label: 'Webhook Tester', icon: Wrench },
]

export function Sidebar({ userEmail }: SidebarProps) {
    const pathname = usePathname()

    return (
        <div className="w-[260px] bg-gradient-to-b from-[#0f0f14] via-[#111118] to-[#0d0d12] text-white flex flex-col relative overflow-hidden border-r border-white/[0.04]">
            {/* Subtle gradient orbs */}
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/[0.06] rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[20%] left-[-20%] w-[150px] h-[150px] bg-violet-500/[0.04] rounded-full blur-[60px] pointer-events-none" />

            {/* Logo */}
            <div className="px-5 py-5 relative">
                <div className="flex items-center gap-3">
                    <motion.div
                        className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center"
                        style={{
                            boxShadow: '0 0 20px rgba(99, 102, 241, 0.3), 0 0 40px rgba(139, 92, 246, 0.15)'
                        }}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                    >
                        <Sparkles className="w-4.5 h-4.5 text-white" />
                    </motion.div>
                    <div>
                        <h1 className="font-semibold text-[15px] text-white tracking-[-0.02em]">
                            AR CRM
                        </h1>
                        <p className="text-[11px] text-white/40 tracking-wide">Enterprise Suite</p>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 relative">
                {navItems.map((item, index) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                        <motion.div
                            key={item.href}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.04, duration: 0.3 }}
                        >
                            <Link
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                                    isActive
                                        ? 'bg-white/[0.08]'
                                        : 'hover:bg-white/[0.04]'
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute left-0 top-[50%] -translate-y-[50%] w-[3px] h-5 bg-gradient-to-b from-indigo-400 to-violet-500 rounded-r-full"
                                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                    />
                                )}
                                <item.icon className={cn(
                                    'w-[18px] h-[18px] transition-all duration-200',
                                    isActive ? 'text-white' : 'text-white/50 group-hover:text-white/70'
                                )} />
                                <span className={cn(
                                    'text-[13px] font-medium tracking-[-0.01em] transition-colors duration-200',
                                    isActive ? 'text-white' : 'text-white/60 group-hover:text-white/80'
                                )}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/30" />
                                )}
                            </Link>
                        </motion.div>
                    )
                })}

                {/* Dev Tools Section */}
                <div className="pt-4 mt-4">
                    <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-3" />
                    <p className="px-3 text-[10px] font-semibold text-white/30 uppercase tracking-[0.08em] mb-2">
                        Dev Tools
                    </p>
                    {devTools.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-[12px]',
                                    isActive
                                        ? 'bg-white/[0.06] text-white/80'
                                        : 'text-white/40 hover:bg-white/[0.03] hover:text-white/60'
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* User Section */}
            <div className="p-3 relative">
                <div className="mx-1 mb-3 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                <motion.div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors cursor-pointer border border-white/[0.04]"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.15 }}
                >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white"
                        style={{ boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)' }}
                    >
                        {userEmail?.[0].toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-[12px] font-medium text-white/90 truncate tracking-[-0.01em]">
                            {userEmail?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-[10px] text-white/40 truncate">{userEmail}</p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
