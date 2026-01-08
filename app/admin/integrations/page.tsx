'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { ArrowRight, Globe, Mail, Settings, Zap, Check, AlertCircle, Link2 } from 'lucide-react'

const integrations = [
    {
        id: 'nationbuilder',
        name: 'NationBuilder',
        description: 'Advocacy & Political CRM',
        icon: Globe,
        color: 'red',
        status: 'active',
        href: '/admin/integrations/nationbuilder'
    },
    {
        id: 'mailchimp',
        name: 'Mailchimp',
        description: 'Email Marketing Platform',
        icon: Mail,
        color: 'amber',
        status: 'setup',
        href: '/admin/integrations/mailchimp'
    },
    {
        id: 'zapier',
        name: 'Zapier',
        description: 'Workflow Automation',
        icon: Zap,
        color: 'orange',
        status: 'inactive',
        href: '#'
    },
    {
        id: 'sync',
        name: 'Sync Settings',
        description: 'Orchestrator Logs & Rules',
        icon: Settings,
        color: 'slate',
        status: 'active',
        href: '#'
    }
]

export default function IntegrationsPage() {
    const router = useRouter()

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-emerald-100 text-emerald-700"><Check className="w-3 h-3 mr-1" /> Active</Badge>
            case 'setup':
                return <Badge className="bg-amber-100 text-amber-700"><AlertCircle className="w-3 h-3 mr-1" /> Setup Required</Badge>
            default:
                return <Badge className="bg-slate-100 text-slate-500">Inactive</Badge>
        }
    }

    return (
        <div className="min-h-screen p-8 space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
                        <Link2 className="w-6 h-6 text-white" />
                    </div>
                    Integrations
                </h1>
                <p className="text-slate-500 mt-2">Connect your CRM to external services and platforms</p>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Integrations', value: integrations.length, color: 'indigo' },
                    { label: 'Active', value: integrations.filter(i => i.status === 'active').length, color: 'emerald' },
                    { label: 'Needs Setup', value: integrations.filter(i => i.status === 'setup').length, color: 'amber' },
                ].map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-xl p-4 shadow-lg shadow-slate-200/50 text-center"
                    >
                        <p className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                        <p className="text-xs text-slate-500">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Integrations Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {integrations.map((integration, index) => (
                    <motion.div
                        key={integration.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        onClick={() => integration.href !== '#' && router.push(integration.href)}
                        className={`cursor-pointer ${integration.href === '#' ? 'cursor-default' : ''}`}
                    >
                        <Card className={`border-0 shadow-xl shadow-slate-200/50 overflow-hidden hover:shadow-2xl transition-all h-full ${integration.status === 'inactive' ? 'opacity-60' : ''
                            }`}>
                            <div className={`h-1 bg-gradient-to-r from-${integration.color}-500 to-${integration.color}-600`} />
                            <CardHeader>
                                <div className={`w-14 h-14 rounded-xl bg-${integration.color}-100 flex items-center justify-center mb-3 shadow-lg shadow-${integration.color}-500/10`}>
                                    <integration.icon className={`w-7 h-7 text-${integration.color}-600`} />
                                </div>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{integration.name}</span>
                                </CardTitle>
                                <CardDescription>{integration.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    {getStatusBadge(integration.status)}
                                    {integration.href !== '#' && (
                                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Add Integration */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card className="border-0 border-2 border-dashed border-slate-200 bg-slate-50/50">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="p-4 rounded-2xl bg-white shadow-lg mb-4">
                            <Link2 className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">Add New Integration</h3>
                        <p className="text-slate-500 text-sm mb-4">Connect more services to enhance your CRM</p>
                        <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                            Browse Integrations
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
