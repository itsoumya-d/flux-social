'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, X, AlertTriangle, TrendingUp,
    MessageCircle, BarChart2, Globe, ShieldAlert,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { type SocialMention } from '@/lib/types';
import {
    getTrackedKeywords,
    addTrackedKeyword,
    deleteTrackedKeyword,
    getSocialMentions,
    detectCrisisThemes,
    type TrackedKeyword
} from '@/app/actions/social-listening';

interface SentimentSummary {
    positive: number;
    neutral: number;
    negative: number;
    total: number;
}

export function SocialListeningDashboard({ brandId }: { brandId?: string }) {
    const [activeTab, setActiveTab] = useState<'monitor' | 'keywords' | 'crisis'>('monitor');
    const [keywords, setKeywords] = useState<TrackedKeyword[]>([]);
    const [mentions, setMentions] = useState<SocialMention[]>([]);
    const [crisisThemes, setCrisisThemes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Keyword input state
    const [newKeyword, setNewKeyword] = useState('');
    const [newCategory, setNewCategory] = useState<TrackedKeyword['category']>('brand');

    useEffect(() => {
        if (brandId) {
            loadDashboardData();
        }
    }, [brandId]);

    const loadDashboardData = async () => {
        if (!brandId) return;
        setIsLoading(true);
        try {
            const [kData, mData, cData] = await Promise.all([
                getTrackedKeywords(brandId),
                getSocialMentions(brandId),
                detectCrisisThemes(brandId)
            ]);

            setKeywords(kData);
            setMentions(mData.mentions);
            setCrisisThemes(cData.themes);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            toast.error('Failed to sync social data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddKeyword = async () => {
        if (!brandId || !newKeyword.trim()) return;

        try {
            const added = await addTrackedKeyword(brandId, newKeyword, newCategory);
            setKeywords([added, ...keywords]);
            setNewKeyword('');
            toast.success('Tracking started for keyword');
        } catch {
            toast.error('Failed to add keyword');
        }
    };

    const handleDeleteKeyword = async (id: string) => {
        try {
            await deleteTrackedKeyword(id);
            setKeywords(prev => prev.filter(k => k.id !== id));
            toast.success('Keyword removed');
        } catch {
            toast.error('Failed to remove keyword');
        }
    };

    const sentimentSummary: SentimentSummary = mentions.reduce((acc, m) => {
        acc[m.sentiment]++;
        acc.total++;
        return acc;
    }, { positive: 0, neutral: 0, negative: 0, total: 0 } as any);

    const sentimentScore = sentimentSummary.total > 0
        ? Math.round(((sentimentSummary.positive - sentimentSummary.negative) / sentimentSummary.total) * 100)
        : 0;

    return (
        <div className="flex flex-col h-full bg-white/5 border border-glass-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-glass-border flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm">Social Listening</h2>
                        <p className="text-[10px] text-muted-foreground">Real-time brand monitoring</p>
                    </div>
                </div>

                {/* Global Sentiment Score */}
                <div className="flex items-center gap-4 bg-white/5 rounded-lg px-4 py-2 border border-white/5">
                    <div className="text-right">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Reputation Score</p>
                        <p className={cn("text-xs font-bold", sentimentScore > 0 ? "text-emerald-400" : "text-rose-400")}>
                            {sentimentScore > 0 ? '+' : ''}{sentimentScore} Net Sentiment
                        </p>
                    </div>
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center border-2",
                        sentimentScore >= 0 ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-rose-500/20 bg-rose-500/10 text-rose-400"
                    )}>
                        {sentimentScore >= 0 ? <TrendingUp className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-glass-border p-1 bg-black/10">
                {(['monitor', 'keywords', 'crisis'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn("flex-1 py-2 text-xs font-bold uppercase tracking-wider relative transition-colors",
                            activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        {tab}
                        {tab === 'crisis' && crisisThemes.length > 0 && (
                            <span className="absolute top-1 right-8 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                        )}
                        {activeTab === tab && (
                            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {/* MONITOR TAB */}
                    {activeTab === 'monitor' && (
                        <motion.div
                            key="monitor"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                    <p className="text-[10px] text-muted-foreground uppercase">Mentions (24h)</p>
                                    <p className="text-xl font-bold">{mentions.length}</p>
                                </div>
                                <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                                    <p className="text-[10px] text-emerald-400 uppercase">Positive</p>
                                    <p className="text-xl font-bold text-emerald-300">{sentimentSummary.positive}</p>
                                </div>
                                <div className="bg-rose-500/10 rounded-lg p-3 border border-rose-500/20">
                                    <p className="text-[10px] text-rose-400 uppercase">Negative</p>
                                    <p className="text-xl font-bold text-rose-300">{sentimentSummary.negative}</p>
                                </div>
                            </div>

                            {/* Mentions Feed */}
                            <div className="space-y-2">
                                {mentions.map((mention) => (
                                    <div key={mention.id} className="p-3 bg-white/5 rounded-xl border border-glass-border hover:bg-white/10 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={mention.author_avatar || undefined} />
                                                    <AvatarFallback>{mention.author_name?.[0] || '?'}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs font-bold">{mention.author_name || 'Unknown'}</span>
                                                <span className="text-[10px] text-muted-foreground">• {mention.platform}</span>
                                            </div>
                                            <Badge className={cn("text-[9px] px-1.5 h-4",
                                                mention.sentiment === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    mention.sentiment === 'negative' ? 'bg-rose-500/20 text-rose-400' :
                                                        'bg-white/10 text-muted-foreground'
                                            )}>
                                                {mention.sentiment}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{mention.content}</p>
                                        <div className="flex gap-4 text-[10px] text-muted-foreground/60 font-mono">
                                            <span className="flex items-center gap-1">👀 {mention.reach_estimate || 0}</span>
                                            <span className="flex items-center gap-1">💬 {mention.engagement_count || 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* KEYWORDS TAB */}
                    {activeTab === 'keywords' && (
                        <motion.div
                            key="keywords"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Add Keyword Form */}
                            <div className="bg-white/5 p-4 rounded-xl border border-glass-border space-y-3">
                                <h3 className="text-xs font-bold uppercase text-muted-foreground">Track New Topic</h3>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter keyword or hashtag..."
                                        value={newKeyword}
                                        onChange={(e) => setNewKeyword(e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                    <select
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value as any)}
                                        className="h-9 bg-black/20 border border-input rounded-md text-xs px-2 outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <option value="brand">Brand</option>
                                        <option value="competitor">Competitor</option>
                                        <option value="industry">Industry</option>
                                        <option value="product">Product</option>
                                    </select>
                                    <Button size="sm" onClick={handleAddKeyword} className="h-9 px-3">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Keywords List */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase text-muted-foreground px-1">Active Trackers</h3>
                                {keywords.map(k => (
                                    <div key={k.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 group">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("h-2 w-2 rounded-full",
                                                k.category === 'brand' ? 'bg-indigo-500' :
                                                    k.category === 'competitor' ? 'bg-rose-500' : 'bg-emerald-500'
                                            )} />
                                            <div>
                                                <p className="text-sm font-medium">{k.keyword}</p>
                                                <p className="text-[10px] text-muted-foreground capitalize">{k.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/20 hover:text-rose-400"
                                                onClick={() => handleDeleteKeyword(k.id)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* CRISIS TAB */}
                    {activeTab === 'crisis' && (
                        <motion.div
                            key="crisis"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {crisisThemes.length === 0 ? (
                                <div className="text-center py-12 px-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                                        <ShieldAlert className="h-6 w-6 text-emerald-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-emerald-400">System Healthy</h3>
                                    <p className="text-xs text-emerald-200/60 mt-1">No significant negative sentiment anomalies detected in the last 24 hours.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-3">
                                        <AlertTriangle className="h-5 w-5 text-rose-500 animate-pulse" />
                                        <div>
                                            <p className="text-xs font-bold text-rose-400">Potential Crisis Detected</p>
                                            <p className="text-[10px] text-rose-300/70">Unusual spike in negative mentions regarding specific topics.</p>
                                        </div>
                                    </div>

                                    {crisisThemes.map((theme, i) => (
                                        <div key={i} className="p-4 bg-white/5 border-l-4 border-l-rose-500 rounded-r-xl">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-sm text-white/90">{theme.theme}</h4>
                                                <Badge className="bg-rose-500 text-white border-none">{theme.count} Mentions</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-3">
                                                Identified as a recurring negative theme across multiple platforms.
                                            </p>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="destructive" className="h-7 text-[10px]">View Mentions</Button>
                                                <Button size="sm" variant="outline" className="h-7 text-[10px] bg-transparent border-white/10">Dismiss Alert</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
