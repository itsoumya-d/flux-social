'use client';

import { useState, useEffect } from 'react';
import {
    Zap,
    ShieldCheck,
    ArrowUpRight,
    Settings2,
    CreditCard,
    AlertTriangle,
    CheckCircle2,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { updateAutoTopupSettings } from '@/app/actions/billing';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function AutoTopupSettings({ initialProfile }: { initialProfile: any }) {
    const [enabled, setEnabled] = useState(initialProfile?.auto_topup_enabled || false);
    const [threshold, setThreshold] = useState(initialProfile?.auto_topup_threshold || 10);
    const [amount, setAmount] = useState(initialProfile?.auto_topup_amount || 50);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanged, setHasChanged] = useState(false);

    useEffect(() => {
        const changed =
            enabled !== (initialProfile?.auto_topup_enabled || false) ||
            threshold !== (initialProfile?.auto_topup_threshold || 10) ||
            amount !== (initialProfile?.auto_topup_amount || 50);
        setHasChanged(changed);
    }, [enabled, threshold, amount, initialProfile]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateAutoTopupSettings({ enabled, threshold, amount });
            toast.success('Billing preferences updated! 🛡️');
            setHasChanged(false);
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                        <Zap className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold">Proactive Performance Billing</h3>
                        <p className="text-xs text-muted-foreground">AI secures credits for high-potential posts automatically.</p>
                    </div>
                </div>
                <Switch
                    checked={enabled}
                    onCheckedChange={setEnabled}
                    className="data-[state=checked]:bg-amber-500"
                />
            </div>

            <AnimatePresence>
                {enabled && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6 overflow-hidden pt-4"
                    >
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-semibold text-muted-foreground">Threshold Trigger</label>
                                <span className="text-sm font-bold">{threshold} Credits</span>
                            </div>
                            <Slider
                                value={[threshold]}
                                onValueChange={([val]) => setThreshold(val)}
                                max={100}
                                min={5}
                                step={5}
                                className="[&_[role=slider]]:bg-amber-500"
                            />
                            <p className="text-[10px] text-muted-foreground/60 italic">
                                &quot;Topup will trigger when balance falls below {threshold} and a high-impact post is detected.&quot;
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-semibold text-muted-foreground">Topup Amount</label>
                                <span className="text-sm font-bold">{amount} Credits</span>
                            </div>
                            <Slider
                                value={[amount]}
                                onValueChange={([val]) => setAmount(val)}
                                max={500}
                                min={50}
                                step={50}
                                className="[&_[role=slider]]:bg-amber-500"
                            />
                            <p className="text-[10px] text-muted-foreground/60 italic">
                                &quot;Each automatic refill adds {amount} credits to your account (approx ${(amount * 0.2).toFixed(2)}).&quot;
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold">Intent-Based Logic</h4>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                        Flux doesn&apos;t just top up when you&apos;re low. Our AI analyzes the viral trajectory of your drafts. If a post has {'>'}85% engagement potential and you&apos;re low on credits, we secure the balance so you can use AI-enhanced scheduling and ROI optimization immediately.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {hasChanged && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex justify-end pt-4"
                    >
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-8 px-4"
                        >
                            {isSaving ? 'Saving...' : 'Apply Changes'}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {!enabled && (
                <div className="p-4 rounded-xl border border-glass-border bg-white/5 text-center space-y-2">
                    <p className="text-xs text-muted-foreground">Maintain momentum with zero friction.</p>
                    <p className="text-[10px] text-muted-foreground/40 italic">Enable proactive billing to ensure your viral hits always have the AI power they need.</p>
                </div>
            )}
        </div>
    );
}
