'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function NewCampaignPage() {
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function createDraft() {
            const { data, error } = await supabase
                .from('email_campaigns')
                .insert({
                    name: 'Untitled Campaign',
                    subject: '',
                    body_html: '',
                    status: 'draft',
                })
                .select('id')
                .single()

            if (error) {
                console.error('Error creating campaign:', error)
                // Handle error (maybe toast)
                return
            }

            router.replace(`/admin/campaigns/${data.id}`)
        }

        createDraft()
    }, [router, supabase])

    return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                <p className="text-slate-500">Creating draft...</p>
            </div>
        </div>
    )
}
