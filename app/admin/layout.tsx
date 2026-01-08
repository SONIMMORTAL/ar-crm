import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { GlobalSearch } from '@/components/global-search'
import { NotificationCenter } from '@/components/notification-center'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen">
            {/* Premium Sidebar */}
            <Sidebar userEmail={user.email} />

            {/* Main Content */}
            <div className="flex-1 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 overflow-auto flex flex-col">
                <header className="h-16 border-b border-slate-200/50 bg-white/80 backdrop-blur-lg flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="w-full max-w-md">
                        <GlobalSearch />
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationCenter />
                    </div>
                </header>
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    )
}
