'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, User, Bell, Globe, Shield, Moon, Palette, Save } from 'lucide-react'

export default function SettingsPage() {
    return (
        <div className="min-h-screen p-8 space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-lg">
                        <Settings className="w-6 h-6 text-white" />
                    </div>
                    Settings
                </h1>
                <p className="text-slate-500 mt-2">Manage your account and preferences</p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Settings */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Settings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="border-0 shadow-xl shadow-slate-200/50">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-100">
                                        <User className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <CardTitle>Profile Settings</CardTitle>
                                        <CardDescription>Manage your account information</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>First Name</Label>
                                        <Input placeholder="John" className="bg-slate-50 border-slate-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Last Name</Label>
                                        <Input placeholder="Doe" className="bg-slate-50 border-slate-200" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input placeholder="admin@example.com" className="bg-slate-50 border-slate-200" />
                                </div>
                                <Button className="bg-gradient-to-r from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
                                    <Save className="w-4 h-4 mr-2" /> Save Changes
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Notification Settings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="border-0 shadow-xl shadow-slate-200/50">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-100">
                                        <Bell className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <CardTitle>Notifications</CardTitle>
                                        <CardDescription>Configure how you receive alerts</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { label: 'Email Notifications', description: 'Receive campaign performance updates', enabled: true },
                                    { label: 'Event Reminders', description: 'Get notified before upcoming events', enabled: true },
                                    { label: 'Weekly Digest', description: 'Summary of your CRM activity', enabled: false },
                                ].map((item, i) => (
                                    <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 hover:bg-slate-100 transition-colors">
                                        <div>
                                            <p className="font-medium text-slate-900">{item.label}</p>
                                            <p className="text-sm text-slate-500">{item.description}</p>
                                        </div>
                                        <Badge className={item.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                                            {item.enabled ? 'On' : 'Off'}
                                        </Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* System Settings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="border-0 shadow-xl shadow-slate-200/50">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-violet-100">
                                        <Globe className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div>
                                        <CardTitle>System Preferences</CardTitle>
                                        <CardDescription>Global CRM configuration</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Timezone</Label>
                                    <Input placeholder="America/New_York" className="bg-slate-50 border-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date Format</Label>
                                    <Input placeholder="MM/DD/YYYY" className="bg-slate-50 border-slate-200" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="border-0 shadow-xl shadow-slate-200/50">
                            <CardHeader>
                                <CardTitle className="text-base">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {[
                                    { label: 'Security Settings', icon: Shield, color: 'emerald' },
                                    { label: 'Appearance', icon: Palette, color: 'violet' },
                                    { label: 'Dark Mode', icon: Moon, color: 'slate' },
                                ].map((action) => (
                                    <motion.div
                                        key={action.label}
                                        whileHover={{ scale: 1.02, x: 4 }}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/80 hover:bg-slate-100 cursor-pointer transition-colors"
                                    >
                                        <div className={`p-2 rounded-lg bg-${action.color}-100`}>
                                            <action.icon className={`w-4 h-4 text-${action.color}-600`} />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">{action.label}</span>
                                    </motion.div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Account Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="border-0 bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
                            <CardContent className="pt-6">
                                <h3 className="font-semibold text-lg mb-2">AR CRM Pro</h3>
                                <p className="text-slate-400 text-sm mb-4">Your account is active and in good standing.</p>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-emerald-500 text-white">Active</Badge>
                                    <Badge className="bg-white/10 text-white">Enterprise</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
