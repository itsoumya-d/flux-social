'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    BarChart3,
    Target,
    Zap,
    Sparkles,
    Send,
    ArrowUpRight,
    Download,
    Loader2,
    Brain,
    TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { askFlux, generateBrandedReport } from '@/app/actions/analytics';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PredictiveAnalytics } from "@/components/predictive-analytics";
import { AiInsightsDashboard } from "@/components/ai-insights-dashboard";
import { SocialPulse } from "@/components/social-pulse";
import { Radio, LayoutDashboard } from 'lucide-react';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { getGrowthStats, getContentPerformance, getPlatformComparison } from '@/app/actions/analytics';

export default function IntelligenceView({
    stats,
    growth,
    predictiveMetrics,
    aiInsights,
    brandId
}: {
    stats: { totalPosts: number; scheduledPosts: number, draftPosts: number };
    growth?: any;
    predictiveMetrics?: any;
    aiInsights?: any;
    brandId?: string;
}) {
    const [query, setQuery] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [dateRange, setDateRange] = useState({ start: new Date(new Date().setDate(new Date().getDate() - 30)), end: new Date() });

    // Detailed analytics state
    const [detailedGrowth, setDetailedGrowth] = useState<any>(growth);
    const [contentPerf, setContentPerf] = useState<any[]>([]);
    const [platformComp, setPlatformComp] = useState<any[]>([]);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

    const searchParams = useSearchParams();

    // Initial fetch for detailed metrics
    useEffect(() => {
        const fetchDetails = async () => {
            if (brandId) {
                const [cPerf, pComp] = await Promise.all([
                    getContentPerformance(brandId),
                    getPlatformComparison(brandId)
                ]);
                setContentPerf(cPerf);
                setPlatformComp(pComp);
            }
        };
        fetchDetails();
    }, [brandId]);

    const handleDateRangeChange = async (start: Date, end: Date) => {
        if (!brandId) return;
        setIsLoadingAnalytics(true);
        setDateRange({ start, end });
        try {
            const newGrowth = await getGrowthStats(brandId, start, end);
            setDetailedGrowth(newGrowth);
        } catch (error) {
            console.error('Failed to update analytics:', error);
            toast.error('Failed to update date range');
        } finally {
            setIsLoadingAnalytics(false);
        }
    };

    useEffect(() => {
        const q = searchParams.get('q');
        if (q && brandId) {
            setQuery(q);
            handleAskFlux(q);
        }
    }, [searchParams, brandId]);

    const handleAskFlux = async (qOverride?: string) => {
        const queryToUse = qOverride || query;
        if (!queryToUse.trim() || !brandId) return;
        setIsAnalyzing(true);
        try {
            const result = await askFlux(brandId, queryToUse);
            setAnalysisResult(result);
        } catch (error) {
            console.error('Analysis failed:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleExport = async (format: 'json' | 'csv') => {
        if (!brandId) {
            toast.error('No brand selected');
            return;
        }
        setIsExporting(true);
        try {
            const today = new Date();
            const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

            const result = await generateBrandedReport({
                brandId,
                dateRange: {
                    start: thirtyDaysAgo.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                },
                format,
                branding: {
                    companyName: 'FluxSocial Analytics'
                }
            });

            if (result.success) {
                const blob = new Blob([result.content], {
                    type: format === 'csv' ? 'text/csv' : 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                toast.success(`Report exported as ${format.toUpperCase()}! 📊`);
            }
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export report');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Intelligence</h1>
                    <p className="text-muted-foreground text-sm">Deep semantic insights into your social performance.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="premium-button border-glass-border bg-white/5 gap-2"
                        onClick={() => handleExport('csv')}
                        disabled={isExporting}
                    >
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        className="premium-button border-glass-border bg-white/5 gap-2"
                        onClick={() => handleExport('json')}
                        disabled={isExporting}
                    >
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Export JSON
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full space-y-6">
                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
                    <TabsTrigger value="overview" className="gap-2 rounded-lg data-[state=active]:bg-indigo-500">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="ask-flux" className="gap-2 rounded-lg data-[state=active]:bg-indigo-500">
                        <Sparkles className="h-4 w-4" />
                        Ask Flux
                    </TabsTrigger>
                    <TabsTrigger value="predictions" className="gap-2 rounded-lg data-[state=active]:bg-indigo-500">
                        <TrendingUp className="h-4 w-4" />
                        Predictions
                    </TabsTrigger>
                    <TabsTrigger value="strategy" className="gap-2 rounded-lg data-[state=active]:bg-indigo-500">
                        <Brain className="h-4 w-4" />
                        AI Strategy
                    </TabsTrigger>
                    <TabsTrigger value="pulse" className="gap-2 rounded-lg data-[state=active]:bg-indigo-500">
                        <Radio className="h-4 w-4" />
                        Pulse Stream
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 outline-none">
                    {isLoadingAnalytics && (
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                        </div>
                    )}

                    {!isLoadingAnalytics && (
                        <AnalyticsDashboard
                            growthData={detailedGrowth || growth}
                            contentPerformance={contentPerf}
                            platformComparison={platformComp}
                            onDateRangeChange={handleDateRangeChange}
                        />
                    )}
                </TabsContent>

                <TabsContent value="ask-flux" className="space-y-8 outline-none animate-in fade-in slide-in-from-bottom-2">
                    {/* Ask Flux - Conversational BI */}
                    <div className="premium-card p-8 bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent border-indigo-500/20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold">Ask Flux</h2>
                        </div>
                        <div className="relative group">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g. 'Show me my best performing content by engagement rate on LinkedIn last week'"
                                className="w-full bg-black/20 border-2 border-glass-border focus:border-indigo-500/50 rounded-2xl h-16 pl-6 pr-16 text-lg outline-none transition-all group-hover:border-white/10"
                            />
                            <button
                                onClick={() => handleAskFlux()}
                                disabled={isAnalyzing}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                            >
                                <Send className="h-5 w-5 text-white" />
                            </button>
                        </div>

                        <AnimatePresence>
                            {isAnalyzing && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-indigo-500/20 relative">
                                        <div className="flex items-start gap-4">
                                            <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center animate-pulse">
                                                <Sparkles className="h-4 w-4 text-indigo-400" />
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <p className="text-sm leading-relaxed">
                                                    {analysisResult?.answer || 'Analyzing your brand performance...'}
                                                </p>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {(analysisResult?.stats || [
                                                        { label: 'CTR', value: '4.2%' },
                                                        { label: 'Conversions', value: '142' },
                                                        { label: 'Repurposable', value: 'Yes' }
                                                    ]).map((s: any, idx: number) => (
                                                        <div key={idx} className="p-4 rounded-xl bg-white/5 border border-glass-border text-center">
                                                            <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{s.label}</div>
                                                            <div className="text-lg font-bold">{s.value}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[
                            { title: 'Content Inventory', value: stats.totalPosts.toString(), trend: '+1', icon: BarChart3, color: 'text-indigo-500' },
                            { title: 'Scheduled Mastery', value: stats.scheduledPosts.toString(), trend: 'Active', icon: Target, color: 'text-emerald-500' },
                            { title: 'Draft Velocity', value: stats.draftPosts.toString(), trend: 'Ready', icon: Zap, color: 'text-amber-500' },
                        ].map((stat, i) => (
                            <div key={i} className="premium-card p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn("p-2 rounded-lg bg-white/5", stat.color)}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                    <div className={cn("flex items-center text-xs font-bold", stat.trend.startsWith('+') ? 'text-emerald-500' : (stat.trend === 'Active' ? 'text-emerald-500' : 'text-amber-500'))}>
                                        {stat.trend} {stat.trend.startsWith('+') && <ArrowUpRight className="h-3 w-3" />}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                                    <div className="text-3xl font-bold mt-1 tracking-tight">{stat.value}</div>
                                </div>

                                <div className="mt-6 flex items-end gap-1 h-8">
                                    {growth?.reachTrend?.map((val: number, idx: number) => (
                                        <div
                                            key={idx}
                                            className={cn("flex-1 rounded-t opacity-30 transition-all hover:opacity-100", stat.color.replace('text-', 'bg-'))}
                                            style={{ height: `${(val / 1000) * 100}%` }}
                                        />
                                    )) || (
                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className={cn("h-full opacity-50", stat.color.replace('text-', 'bg-'))} style={{ width: '60%' }} />
                                            </div>
                                        )}
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="predictions" className="outline-none">
                    <PredictiveAnalytics brandId={brandId} data={predictiveMetrics} />
                </TabsContent>

                <TabsContent value="strategy" className="outline-none">
                    <AiInsightsDashboard brandId={brandId} data={aiInsights} />
                </TabsContent>

                <TabsContent value="pulse" className="outline-none">
                    <SocialPulse brandId={brandId || ''} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
