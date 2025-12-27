"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PricingTable } from "@/components/pricing-table";
import { Sparkles } from "lucide-react";

interface PricingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl bg-black/90 backdrop-blur-xl border-glass-border">
                <DialogHeader>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="p-2 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                            <Sparkles className="h-5 w-5 text-indigo-400" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-2xl font-bold">Unlock the full power of Flux</DialogTitle>
                    <p className="text-center text-muted-foreground">Get access to advanced AI tools, sentiment analysis, and unlimited accounts.</p>
                </DialogHeader>
                <div className="mt-4">
                    <PricingTable />
                </div>
            </DialogContent>
        </Dialog>
    );
}
