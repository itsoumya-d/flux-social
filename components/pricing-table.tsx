"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export function PricingTable() {
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            // In a real app, call an API route to create a Stripe Checkout Session
            // const response = await fetch('/api/stripe/checkout', { method: 'POST' });
            // const data = await response.json();
            // window.location.href = data.url;

            // For prototype:
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success("Redirecting to secure checkout...");
        } catch {
            toast.error("Failed to start checkout");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto p-6">
            {/* Free Tier */}
            <div className="rounded-2xl border border-glass-border bg-white/5 p-8 flex flex-col animate-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
                <div className="mb-4">
                    <h3 className="text-xl font-bold">Starter</h3>
                    <div className="text-3xl font-bold mt-2">$0 <span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    <p className="text-sm text-muted-foreground mt-2">Perfect for side projects & hobbyists.</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-emerald-500" /> 3 Social Accounts</li>
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-emerald-500" /> Basic Scheduling</li>
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-emerald-500" /> 7-Day Analytics History</li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 opacity-20" /> AI Composer Tools</li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 opacity-20" /> Smart Inbox (Sentiment)</li>
                </ul>
                <Button variant="outline" className="w-full" disabled>Current Plan</Button>
            </div>

            {/* Pro Tier */}
            <div className="rounded-2xl border border-indigo-500/50 bg-indigo-500/5 p-8 flex flex-col relative overflow-hidden group animate-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
                <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full group-hover:bg-indigo-500/10 transition-colors" />

                <div className="mb-4 relative">
                    <h3 className="text-xl font-bold text-indigo-300">Pro</h3>
                    <div className="text-3xl font-bold mt-2">$29 <span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    <p className="text-sm text-muted-foreground mt-2">For serious creators & brands.</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1 relative">
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-indigo-400" /> Unlimited Social Accounts</li>
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-indigo-400" /> <strong>Advanced AI Tools</strong></li>
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-indigo-400" /> <strong>Smart Inbox & Sentiment</strong></li>
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-indigo-400" /> Unlimited History</li>
                    <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-indigo-400" /> Priority Support</li>
                </ul>
                <Button
                    onClick={handleUpgrade}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 relative"
                    disabled={isLoading}
                >
                    {isLoading ? "Processing..." : "Upgrade to Pro"}
                </Button>
            </div>
        </div>
    );
}
