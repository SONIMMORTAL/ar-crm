'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Database } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

type Event = Database['public']['Tables']['events']['Row']

const formSchema = z.object({
    first_name: z.string().min(2, 'First name is required'),
    last_name: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    agree_updates: z.boolean(),
})

export default function RegistrationForm({ event }: { event: Event }) {
    const [loading, setLoading] = useState(false)
    const [errorConfig, setErrorConfig] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            agree_updates: false,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        setErrorConfig(null)

        try {
            // 1. Check if contact exists or create new one
            // We use a simple select -> insert approach for Day 2.
            // Ideally we should use an upsert, but we need the ID back.

            // Since public RLS might block reading 'contacts' by details,
            // we'll rely on our API route or Server Action for safe writes.
            // But for Day 2 (as agreed in plan), we are calling API from frontend after finding contact.
            // Wait, plan said "Submit -> Create/Update contact".

            // CRITICAL: We need a server-side action to handle the Contact creation/lookup securely
            // because we shouldn't expose public write to 'contacts' table ideally.
            // However, for this MVP phase, we might not have set up a Server Action yet.
            // Let's create a specialized Server Action for registration to keep it clean.

            // REFACTOR ON THE FLY: Moving logic to a Server Action is cleaner than client-side DB calls.
            // I will create a server action in a separate file next.
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, eventId: event.id, eventSlug: event.slug })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed')
            }

            router.push(`/register/${event.slug}/success`)

        } catch (err) {
            console.error(err)
            setErrorConfig(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {errorConfig && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                        {errorConfig}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Jane" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="jane@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone (Optional)</FormLabel>
                            <FormControl>
                                <Input type="tel" placeholder="+1 (555) 000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="agree_updates"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Get Updates
                                </FormLabel>
                                <FormDescription>
                                    Receive email updates about this event.
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                        </>
                    ) : (
                        'Complete Registration'
                    )}
                </Button>
            </form>
        </Form>
    )
}
