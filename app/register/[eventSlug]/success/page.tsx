import { Button } from "@/components/ui/button"
import { Check, Calendar, Share2, ArrowRight } from "lucide-react"

export default async function RegistrationSuccessPage({ params }: { params: Promise<{ eventSlug: string }> }) {
    const { eventSlug } = await params
    // Mock data - in real app would fetch based on session or recently created ID
    // For Day 2 proof of concept, we show a generic success message

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
                <div className="bg-green-600 p-8 text-center text-white">
                    <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold">You&apos;re In!</h1>
                    <p className="text-green-100 mt-2">Registration Complete</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-semibold text-slate-900">Check your email!</h2>
                        <p className="text-slate-600">
                            We&apos;ve sent your ticket with a QR code to your inbox. Please save it for check-in.
                        </p>
                    </div>

                    <p className="text-gray-600 mb-6">We&apos;re excited to see you there! A confirmation email has been sent.</p>

                    <div className="bg-blue-50 p-4 rounded-md mb-6 text-sm text-blue-800">
                        {/* <Event className="w-4 h-4 inline mr-2" /> */} {/* Assuming Event is a placeholder for an icon, commented out to avoid import error */}
                        Add to Calendar (Coming Soon)
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" /> Add to Calendar
                        </Button>
                    </div>

                    <div className="text-center pt-4">
                        <Button variant="link" className="text-slate-500 hover:text-slate-800">
                            Register another person <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                    <p className="text-xs text-slate-400">Can&apos;t make it? Please contact support.</p>
                </div>
            </div>
        </div>
    )
}
