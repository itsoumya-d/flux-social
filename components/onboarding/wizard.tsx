"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, Rocket, Target, Users, BarChart3, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getOAuthUrl } from "@/app/actions/oauth";

type Step = "welcome" | "goals" | "connect" | "ai-setup" | "complete";

export function OnboardingWizard() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>("welcome");
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [isConnecting, setIsConnecting] = useState(false);
    const [aiProgress, setAiProgress] = useState(0);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        // Check if onboarding is active via URL param or local storage
        const isOnboarding = searchParams.get("onboarding") === "true";
        const hasCompleted = localStorage.getItem("flux_onboarding_completed");

        if (isOnboarding || !hasCompleted) {
            setOpen(true);
            // If returning from OAuth (success param), skip to AI setup or next step
            if (searchParams.get("success") === "connected") {
                setStep("ai-setup");
            }
        }
    }, [searchParams]);

    const handleGoalToggle = (goal: string) => {
        if (selectedGoals.includes(goal)) {
            setSelectedGoals(selectedGoals.filter(g => g !== goal));
        } else {
            setSelectedGoals([...selectedGoals, goal]);
        }
    };

    const handleConnect = async (platform: string) => {
        setIsConnecting(true);
        try {
            // Use existing action to get OAuth URL
            // We need a dummy brand ID if none exists, or handle it in the action.
            // For now, let's assume the user has a default brand created by the efficient getAccessibleBrands logic
            // But we prefer not to redirect away from the wizard context if possible, 
            // OR we accept the redirect and expect to return here.

            // To properly redirect back:
            const origin = window.location.origin;
            const redirectBack = `${origin}/?onboarding=true&success=connected`;

            // Note: This relies on the backend supporting a custom redirect, 
            // or we might need to rely on the standard callback which redirects to /dashboard?onboarding=true
            // as per our plan.

            // For this UI demo, we'll simulate the "Connect" action if we stay on page,
            // but in reality OAuth requires a full page redirect.
            // Let's implement the redirect call.

            // NOTE: We need a brandId. In this wizard, we might not have it in context yet if it's effectively a global modal.
            // Ideally we fetch the default brand ID first. 
            // For now, we'll trigger the standard action which handles the redirect.

            // Since we can't easily get brandId here without passing it in or fetching it,
            // we will simulate the "Connect" button simply redirecting the user to the Settings page in a real app,
            // or better, we ask the backend for the URL.

            // For this implementation, we will use a hardcoded assumption that we redirect to the OAuth endpoint directly
            // or call the server action if we can.

            // Let's use the actual server action if possible, but we need to import it.
            // We'll leave the actual implementation of the specific OAuth call for the integration step
            // and just show the UI logic here.

            // Placeholder for actual OAuth trigger
            router.push(`/settings?onboarding=true`); // Temporary fallback for this specific line

        } catch (error) {
            toast.error("Failed to initiate connection");
        } finally {
            setIsConnecting(false);
        }
    };

    // AI Simulation Effect
    useEffect(() => {
        if (step === "ai-setup") {
            const interval = setInterval(() => {
                setAiProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => setStep("complete"), 500);
                        return 100;
                    }
                    return prev + 2; // 50 ticks * X ms
                });
            }, 50);
            return () => clearInterval(interval);
        }
    }, [step]);

    const handleComplete = () => {
        localStorage.setItem("flux_onboarding_completed", "true");
        setOpen(false);
        router.push("/"); // Clear query params
        toast.success("Onboarding complete! Welcome to Flux.");
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => {
            // Prevent closing unless complete or explicitly skipped (optional)
            if (!val && step === "complete") setOpen(false);
        }}>
            <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 p-0 overflow-hidden gap-0">

                {/* Progress Bar */}
                <div className="h-1 w-full bg-zinc-900">
                    <div
                        className="h-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${step === 'welcome' ? 0 : step === 'goals' ? 33 : step === 'connect' ? 66 : 100}%` }}
                    />
                </div>

                <div className="p-6">
                    {/* Step: Welcome */}
                    {step === "welcome" && (
                        <div className="text-center space-y-6 py-8">
                            <div className="mx-auto w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4">
                                <Rocket className="w-8 h-8 text-indigo-400" />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-bold text-center">Welcome to FluxSocial</DialogTitle>
                                <DialogDescription className="text-center text-lg mt-2">
                                    Let's turn your social media into a growth engine in less than 2 minutes.
                                </DialogDescription>
                            </DialogHeader>
                            <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-500 mt-8" onClick={() => setStep("goals")}>
                                Get Started <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* Step: Goals */}
                    {step === "goals" && (
                        <div className="space-y-6">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">What's your primary focus?</DialogTitle>
                                <DialogDescription>We'll customize your AI agent based on these goals.</DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                {[
                                    { id: "growth", label: "Audience Growth", icon: Users },
                                    { id: "engagement", label: "High Engagement", icon: Target },
                                    { id: "sales", label: "Drive Sales", icon: BarChart3 },
                                ].map((goal) => (
                                    <button
                                        key={goal.id}
                                        onClick={() => handleGoalToggle(goal.id)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${selectedGoals.includes(goal.id)
                                                ? "border-indigo-500 bg-indigo-500/10"
                                                : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/50"
                                            }`}
                                    >
                                        <goal.icon className={`w-6 h-6 mb-3 ${selectedGoals.includes(goal.id) ? "text-indigo-400" : "text-zinc-400"}`} />
                                        <div className="font-semibold">{goal.label}</div>
                                    </button>
                                ))}
                            </div>

                            <Button
                                size="lg"
                                className="w-full mt-4"
                                disabled={selectedGoals.length === 0}
                                onClick={() => setStep("connect")}
                            >
                                Continue
                            </Button>
                        </div>
                    )}

                    {/* Step: Connect */}
                    {step === "connect" && (
                        <div className="space-y-6">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">Connect your identity</DialogTitle>
                                <DialogDescription>Link your profiles to enable real-time tracking and publishing.</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3">
                                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold">X</div>
                                        <div>
                                            <div className="font-medium">X (Twitter)</div>
                                            <div className="text-xs text-zinc-400">Post & Reply Automation</div>
                                        </div>
                                    </div>
                                    <Button variant="outline" onClick={() => handleConnect('twitter')}>Connect</Button>
                                </div>
                                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">in</div>
                                        <div>
                                            <div className="font-medium">LinkedIn</div>
                                            <div className="text-xs text-zinc-400">Professional Network</div>
                                        </div>
                                    </div>
                                    <Button variant="outline" onClick={() => handleConnect('linkedin')}>Connect</Button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4">
                                <Button variant="ghost" onClick={() => setStep("ai-setup")}>Skip for now</Button>
                                <Button onClick={() => setStep("ai-setup")}>Continue</Button>
                            </div>
                        </div>
                    )}

                    {/* Step: AI Setup */}
                    {step === "ai-setup" && (
                        <div className="py-12 text-center space-y-6">
                            <div className="relative mx-auto w-20 h-20">
                                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30 animate-pulse" />
                                <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
                                <div className="absolute inset-2 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-indigo-400" />
                                </div>
                            </div>

                            <h3 className="text-xl font-medium">Calibrating your AI Agent...</h3>
                            <p className="text-zinc-400 max-w-xs mx-auto text-sm">
                                Analyzing your selected goals ({selectedGoals.join(", ")}) and optimizing content strategy.
                            </p>

                            <div className="w-full bg-zinc-900 rounded-full h-2 mt-8 overflow-hidden">
                                <div
                                    className="bg-indigo-500 h-full transition-all duration-300 ease-out"
                                    style={{ width: `${aiProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step: Complete */}
                    {step === "complete" && (
                        <div className="text-center space-y-6 py-6 animate-in zoom-in-50 duration-500">
                            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 text-green-500">
                                <Check className="w-8 h-8" />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-bold text-center">You're all set!</DialogTitle>
                                <DialogDescription className="text-center text-lg">
                                    FluxSocial is ready to supercharge your growth.
                                </DialogDescription>
                            </DialogHeader>

                            <Button size="lg" className="w-full bg-green-600 hover:bg-green-500 mt-6" onClick={handleComplete}>
                                Enter Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
