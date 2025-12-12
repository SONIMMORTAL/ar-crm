import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import RegistrationForm from './registration-form'

export default async function RegistrationPage({ params }: { params: Promise<{ eventSlug: string }> }) {
    const { eventSlug } = await params
    const supabase = createAdminClient()

    // Fetch event details
    const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', eventSlug)
        .single()

    if (error || !event) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-slate-50 lg:flex">
            {/* Event Details Sidebar (Left/Top) */}
            <div className="lg:w-1/2 bg-slate-900 text-white p-8 lg:p-12 flex flex-col justify-between">
                <div>
                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 line-clamp-3">
                        {event.name}
                    </h1>

                    <div className="space-y-6 text-lg text-slate-300">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 font-semibold text-white/50 uppercase text-xs tracking-wider">When</div>
                            <div>
                                {new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                <br />
                                {new Date(event.event_date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="mt-1 font-semibold text-white/50 uppercase text-xs tracking-wider">Where</div>
                            <div>{event.location || 'Location TBD'}</div>
                        </div>

                        {event.description && (
                            <div className="pt-6 border-t border-white/10 text-base leading-relaxed opacity-80">
                                {event.description}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 text-sm text-slate-500">
                    Powered by AR CRM
                </div>
            </div>

            {/* Registration Form (Right/Bottom) */}
            <div className="lg:w-1/2 p-4 lg:p-12 flex items-center justify-center">
                <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Reserve your spot</h2>
                        <p className="text-slate-500 mt-2">Fill out the form below to register.</p>
                    </div>

                    <RegistrationForm event={event} />
                </div>
            </div>
        </div>
    )
}
