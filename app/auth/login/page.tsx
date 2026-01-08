'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/admin/dashboard')
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>Sign in to your CRM dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <div className="flex justify-end">
                            <Link href="/auth/forgot-password" className="text-sm text-muted-foreground hover:text-primary">
                                Forgot Password?
                            </Link>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                            Sign In
                        </Button>

                        <div className="text-center text-sm">
                            <Link href="/auth/signup" className="text-blue-600 hover:underline">Create Account</Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
