'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Loader2, Camera, CameraOff } from 'lucide-react'

interface QRScannerProps {
    onScan: (data: string) => Promise<void>
    onError?: (error: string) => void
    onClose?: () => void
}

export function QRScanner({ onScan, onError, onClose }: QRScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const [isScanning, setIsScanning] = useState(false)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        // Initialize scanner
        // We use Html5Qrcode directly for more control than the Scanner UI widget
        const scannerId = "reader"

        const startScanning = async () => {
            try {
                const scanner = new Html5Qrcode(scannerId)
                scannerRef.current = scanner

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    async (decodedText) => {
                        if (processing) return // Debounce
                        setProcessing(true)

                        // Pause scanning while processing
                        // await scanner.pause(true) 

                        try {
                            await onScan(decodedText)
                            // Close on success? Or just continue? Let parent decide
                        } catch (err) {
                            onError?.(String(err))
                            // await scanner.resume()
                        } finally {
                            setProcessing(false)
                        }
                    },
                    (errorMessage) => {
                        // ignored, runs every frame
                    }
                )
                setIsScanning(true)
            } catch (err) {
                console.error("Camera start failed", err)
                onError?.("Could not start camera. Ensure permission is granted.")
            }
        }

        startScanning()

        return () => {
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(console.error)
            }
        }
    }, [onScan, onError, processing])

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="flex-1 relative flex items-center justify-center">
                <div id="reader" className="w-full h-full max-w-md mx-auto bg-black"></div>

                {/* Overlay Guide */}
                <div className="absolute inset-0 border-[50px] border-black/50 pointer-events-none flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500 -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500 -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500 -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500 -mb-1 -mr-1"></div>
                    </div>
                </div>

                {processing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                    </div>
                )}
            </div>

            <div className="p-6 bg-slate-900 pb-12 flex justify-center">
                <Button variant="secondary" size="lg" onClick={onClose} className="rounded-full px-8">
                    Close Camera
                </Button>
            </div>
        </div>
    )
}
