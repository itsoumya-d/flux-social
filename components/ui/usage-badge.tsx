'use client';

import { useEffect, useState } from 'react';
import { getCreditBalance } from '@/app/actions/monetization';
import { Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { PricingModal } from '../payments/pricing-modal';

export function UsageBadge() {
    const [balance, setBalance] = useState<number | null>(null);
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        const fetchBalance = async () => {
            const b = await getCreditBalance();
            setBalance(b === 999999 ? null : b);
            setIsPro(b === 999999);
        };
        fetchBalance();
    }, []);

    if (balance === null && !isPro) return null;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full glass cursor-pointer hover:bg-white/10 transition-colors"
                    >
                        {isPro ? (
                            <div className="flex items-center gap-1.5 text-amber-400">
                                <Zap className="w-3.5 h-3.5 fill-amber-400" />
                                <span className="text-xs font-bold tracking-tight uppercase">Pro</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-xs font-semibold">
                                    {balance} Credits
                                </span>
                            </div>
                        )}
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-900 border-white/10 p-4 w-64">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Usage Limit</span>
                            <span className="text-xs font-bold">{isPro ? 'Unlimited' : `${balance} / 50`}</span>
                        </div>
                        {!isPro && (
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(balance! / 50) * 100}%` }}
                                    className="bg-blue-500 h-full"
                                />
                            </div>
                        )}
                        <p className="text-[10px] text-gray-500 leading-normal">
                            AI generation and image creation consume credits. Upgrade to Pro for unlimited access and priority generation.
                        </p>
                        <PricingModal>
                            <Button size="sm" className="w-full h-8 text-[11px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0">
                                Upgrade Now
                            </Button>
                        </PricingModal>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
