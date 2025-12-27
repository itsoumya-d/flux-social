'use client';

import { useState } from 'react';
import { createCheckoutSession } from '@/app/actions/stripe';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Check, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';

const PLANS = [
    {
        name: 'Free',
        price: '0',
        credits: '50 Credits / mo',
        features: [
            'Basic AI Assistant',
            '5 Social Profiles',
            'Standard Post Scheduling',
            'Community Inbox'
        ],
        button: 'Current Plan',
        isCurrent: true
    },
    {
        name: 'Pro',
        price: '19',
        priceId: 'price_H5ggL2vS', // Example ID
        credits: 'Unlimited AI Credits',
        features: [
            'Unlimited AI Generation',
            'DALL-E 3 Image Generation',
            'Advanced ROI Prediction',
            'Brand Voice Intelligence',
            'Priority Support'
        ],
        button: 'Upgrade to Pro',
        isCurrent: false,
        recommended: true
    }
];

export function PricingModal({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async (priceId: string) => {
        setLoading(true);
        try {
            const { url } = await createCheckoutSession(priceId);
            if (url) window.location.href = url;
        } catch (error) {
            toast.error('Failed to start checkout. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] bg-zinc-950 border-white/10 p-0 overflow-hidden glass border-0 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative p-10 flex flex-col ${plan.recommended ? 'bg-zinc-900/50' : 'bg-transparent'} transition-all`}
                        >
                            {plan.recommended && (
                                <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                            )}

                            {plan.recommended && (
                                <div className="mb-6 flex items-center gap-1.5 text-blue-400 text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 w-fit px-2 py-1 rounded-full border border-blue-500/20">
                                    <Sparkles className="w-3 h-3 fill-blue-400" />
                                    Recommended
                                </div>
                            )}
                            <h3 className="text-2xl font-bold mb-1 tracking-tight">{plan.name}</h3>
                            <div className="mb-8">
                                <span className="text-4xl font-extrabold tracking-tighter">${plan.price}</span>
                                <span className="text-muted-foreground text-sm font-medium ml-1">/month</span>
                            </div>

                            <div className="space-y-4 mb-10 flex-1">
                                <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    {plan.credits}
                                </div>
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-center gap-3 text-sm text-gray-300">
                                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                            <Check className="w-3 h-3 text-emerald-500" />
                                        </div>
                                        <span className="leading-tight">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={() => plan.priceId && handleUpgrade(plan.priceId)}
                                disabled={plan.isCurrent || loading}
                                className={`w-full h-12 text-sm font-bold rounded-xl transition-all ${plan.recommended
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-[1.02] active:scale-[0.98]'
                                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                    }`}
                            >
                                {loading ? 'Processing...' : plan.button}
                            </Button>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
