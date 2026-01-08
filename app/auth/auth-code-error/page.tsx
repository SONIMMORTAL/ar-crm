'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'
import { AlertOctagon } from 'lucide-react'

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-red-200">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4 text-red-500">
                        <AlertOctagon className="w-12 h-12" />
                    </div>
                    <CardTitle>Authentication Error</CardTitle>
                    <CardDescription>
                        We couldn't verify your request. The link may have expired or is invalid.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Link href="/auth/login">
                        <Button variant="outline">Back to Login</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}
