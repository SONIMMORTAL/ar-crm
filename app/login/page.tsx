'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        // Try to sign in
        let { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            // If user not found, try to sign up (Dev convenience)
            if (error.message.includes('Invalid login credentials')) {
                // For a real app we wouldn't auto-signup on failed login, but for this scaffolding phase it's helpful
                // Actually, let's just make them separate buttons for clarity
                setMessage(error.message)
            } else {
                setMessage(error.message)
            }
            setLoading(false)
            return
        }

        router.refresh()
        router.push('/admin/campaigns')
    }

    const handleSignUp = async () => {
        setLoading(true)
        setMessage(null)

        const { error } = await supabase.auth.signUp({
            email,
            password,
        })

        if (error) {
            setMessage(error.message)
        } else {
            setMessage('Check your email for the confirmation link!')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>Sign in to access the CRM Admin.</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        {message && (
                            <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-100">
                                {message}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                        </Button>
                        <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={handleSignUp}>
                            Create Account
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
