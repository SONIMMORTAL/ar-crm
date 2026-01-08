'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Notification {
    id: string
    title: string
    message: string
    read: boolean
    created_at: string
}

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await (supabase as any)
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10)

            if (data) {
                setNotifications(data)
                setUnreadCount(data.filter((n: any) => !n.read).length)
            }
        }

        fetchNotifications()

        // Realtime Subscription
        const subscription = supabase
            .channel('notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
                payload => {
                    setNotifications(prev => [payload.new as Notification, ...prev])
                    setUnreadCount(prev => prev + 1)
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const markAsRead = async (id: string) => {
        await (supabase as any).from('notifications').update({ read: true }).eq('id', id)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-slate-400 hover:text-white" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            No notifications yet.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map(n => (
                                <div key={n.id} className={`p-4 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}>
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <p className="font-medium text-sm">{n.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                                            <p className="text-[10px] text-slate-400 mt-2">{new Date(n.created_at).toLocaleTimeString()}</p>
                                        </div>
                                        {!n.read && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => markAsRead(n.id)}>
                                                <Check className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
