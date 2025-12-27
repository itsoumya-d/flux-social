"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight } from "lucide-react"

export function OnboardingTour() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const hasSeenTour = localStorage.getItem("flux_onboarding_completed")

        if (!hasSeenTour) {
            setTimeout(() => {
                toast.custom((t) => (
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 p-4 rounded-xl shadow-2xl w-[350px] animate-in slide-in-from-bottom-5 duration-500">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-500/20 rounded-lg">
                                <Sparkles className="h-6 w-6 text-indigo-400" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <h3 className="font-bold text-white text-lg">Welcome to FluxSocial! 🚀</h3>
                                <p className="text-sm text-indigo-200/80 leading-relaxed">
                                    Your <strong>Smart Command Center</strong> is ready.
                                    Start by connecting your brands or drafting your first AI-powered post.
                                </p>
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        size="sm"
                                        className="bg-indigo-500 hover:bg-indigo-600 text-white border-0 h-8"
                                        onClick={() => {
                                            localStorage.setItem("flux_onboarding_completed", "true")
                                            toast.dismiss(t)
                                        }}
                                    >
                                        Get Started <ArrowRight className="ml-1.5 h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-indigo-300 hover:text-white"
                                        onClick={() => {
                                            localStorage.setItem("flux_onboarding_completed", "true")
                                            toast.dismiss(t)
                                        }}
                                    >
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ), { duration: Infinity })
            }, 1500)
        }
    }, [])

    if (!mounted) return null
    return null
}
