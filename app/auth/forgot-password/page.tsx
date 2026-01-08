'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${location.origin}/auth/callback?next=/auth/update-password`,
        })

        if (error) {
            setError(error.message)
        } else {
            setSubmitted(true)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen grid items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
                    <CardDescription className="text-center">
                        Enter your email to receive a reset link
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {submitted ? (
                        <div className="text-center space-y-4 py-4">
                            <div className="flex justify-center text-green-600">
                                <CheckCircle className="w-16 h-16" />
                            </div>
                            <h3 className="font-semibold text-lg">Check your email</h3>
                            <p className="text-muted-foreground text-sm">
                                We sent a password reset link to <br />
                                <span className="font-medium text-foreground">{email}</span>
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            {error && (
                                <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                                    {error}
                                </div>
                            )}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Reset Link
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="justify-center">
                    <Link
                        href="/auth/login"
                        className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
