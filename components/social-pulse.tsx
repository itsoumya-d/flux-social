'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Sparkles,
    TrendingUp,
    TrendingDown,
    Zap,
    MessageSquare,
    Radio,
    Search,
    Globe,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { PulseItem, getPulseData, simulatePulseStream } from '@/app/actions/pulse';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { toast } from 'sonner';

export function SocialPulse({ brandId }: { brandId: string }) {
    const [items, setItems] = useState<PulseItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

    // Initial load
    useEffect(() => {
        if (brandId) {
            getPulseData(brandId).then(data => {
                setItems(data);
                setIsLoading(false);
            });
        }
    }, [brandId]);

    // Derived analytics
    const entityStats = useMemo(() => {
        const stats: Record<string, { count: number; sentiment: number }> = {};
        items.forEach(item => {
            item.entities.forEach(entity => {
                if (!stats[entity]) stats[entity] = { count: 0, sentiment: 0 };
                stats[entity].count++;
                stats[entity].sentiment += item.sentiment === 'positive' ? 1 : (item.sentiment === 'negative' ? -1 : 0);
            });
        });
        return Object.entries(stats).sort((a, b) => b[1].count - a[1].count);
    }, [items]);

    const sentimentBalance = useMemo(() => {
        const positive = items.filter(i => i.sentiment === 'positive').length;
        const negative = items.filter(i => i.sentiment === 'negative').length;
        return { positive, negative, neutral: items.length - positive - negative };
    }, [items]);

    const handleSimulation = async () => {
        setIsSimulating(true);
        try {
            const batch = await simulatePulseStream(brandId);
            setItems(prev => [...batch, ...prev]);
            toast.success(`Simulated ${batch.length} new mentions!`);
        } finally {
            setIsSimulating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[600px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="premium-card p-4 flex items-center gap-4 border-indigo-500/20 bg-indigo-500/5">
                    <div className="p-2 rounded-lg bg-indigo-500">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Velocity</div>
                        <div className="text-xl font-extrabold tracking-tight">{items.length} <span className="text-xs font-normal opacity-50">/ 24h</span></div>
                    </div>
                </div>
                <div className="premium-card p-4 flex items-center gap-4 border-emerald-500/20 bg-emerald-500/5">
                    <div className="p-2 rounded-lg bg-emerald-500">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Positive</div>
                        <div className="text-xl font-extrabold tracking-tight">{sentimentBalance.positive}</div>
                    </div>
                </div>
                <div className="premium-card p-4 flex items-center gap-4 border-rose-500/20 bg-rose-500/5">
                    <div className="p-2 rounded-lg bg-rose-500">
                        <TrendingDown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Negative</div>
                        <div className="text-xl font-extrabold tracking-tight">{sentimentBalance.negative}</div>
                    </div>
                </div>
                <div className="premium-card p-4 flex items-center gap-4 border-amber-500/20 bg-amber-500/5">
                    <div className="p-2 rounded-lg bg-amber-500">
                        <Radio className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div className="flex-1">
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Live Status</div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSimulation}
                            disabled={isSimulating}
                            className="h-6 mt-1 text-[10px] bg-white/10 hover:bg-white/20 border border-white/10"
                        >
                            {isSimulating ? 'Sending...' : 'Simulate Pulse'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Visualizations (Heatmap & Cloud) */}
                <div className="md:col-span-8 space-y-6">
                    {/* Entity Cloud */}
                    <div className="premium-card p-6 min-h-[240px]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-md bg-white/5 border border-white/10">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                </span>
                                <h3 className="font-bold text-sm tracking-tight uppercase">Intelligence Cloud</h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground">Top Keywords</Badge>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {entityStats.map(([name, { count, sentiment }]) => (
                                <motion.button
                                    key={name}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedEntity(selectedEntity === name ? null : name)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                        selectedEntity === name
                                            ? "bg-primary border-primary text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                                            : "bg-white/5 border-white/5 hover:bg-white/10"
                                    )}
                                >
                                    <span className="mr-2 opacity-50">#</span>
                                    {name}
                                    <span className={cn(
                                        "ml-2 px-1.5 py-0.5 rounded text-[10px] font-extrabold",
                                        sentiment > 0 ? "bg-emerald-500/20 text-emerald-400" : (sentiment < 0 ? "bg-rose-500/20 text-rose-400" : "bg-white/10 text-white/50")
                                    )}>
                                        {count}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Simulation Heatmap (Mock Visual) */}
                    <div className="premium-card p-6 h-[300px] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
                        <div className="flex items-center justify-between mb-8 relative">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-md bg-white/5 border border-white/10">
                                    <Globe className="w-4 h-4 text-blue-400" />
                                </span>
                                <h3 className="font-bold text-sm tracking-tight uppercase">Global Sentiment Intensity</h3>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Joy
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                                    Crisis
                                </div>
                            </div>
                        </div>

                        {/* Mock Heatmap Grid */}
                        <div className="grid grid-cols-24 gap-1 h-32">
                            {Array.from({ length: 24 * 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "rounded-sm transition-all duration-1000",
                                        Math.random() > 0.9
                                            ? (Math.random() > 0.5 ? "bg-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]")
                                            : "bg-white/5"
                                    )}
                                />
                            ))}
                        </div>

                        <div className="mt-8 flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                            <span>24 Hours Ago</span>
                            <span>Peak Reach</span>
                            <span>Now</span>
                        </div>
                    </div>
                </div>

                {/* Real-time Feed (Live List) */}
                <div className="md:col-span-4 flex flex-col premium-card border-none bg-black/40 p-0 overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-white/5 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" />
                                <h3 className="font-bold text-sm tracking-tight uppercase tracking-widest">Pulse Stream</h3>
                            </div>
                            <div className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                                placeholder="Filter stream..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl h-9 pl-9 pr-3 text-[11px] outline-none focus:border-indigo-500/50"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[700px] p-4 space-y-3 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {items
                                .filter(item => !selectedEntity || item.entities.includes(selectedEntity))
                                .map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className={cn(
                                            "p-4 rounded-xl border transition-all cursor-default",
                                            item.sentiment === 'positive' ? "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20" :
                                                (item.sentiment === 'negative' ? "bg-rose-500/5 border-rose-500/10 hover:border-rose-500/20" : "bg-white/5 border-white/5")
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6 border border-white/10">
                                                    <AvatarFallback className="text-[10px] font-bold">@{item.author[0]}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-[11px] font-bold text-white/90">@{item.author}</span>
                                            </div>
                                            <Badge variant="outline" className="text-[8px] uppercase tracking-tighter border-white/10 opacity-60">
                                                {item.platform}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-white/70 mb-3 px-0.5">
                                            {item.content}
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {item.entities.map(e => (
                                                <span key={e} className="text-[9px] font-extrabold text-white/30 uppercase tracking-widest transition-colors hover:text-white/60">
                                                    #{e}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                        </AnimatePresence>
                    </div>

                    <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                        <button className="text-[10px] font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">
                            Load Historical Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
