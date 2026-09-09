'use client';

import { useState } from 'react';
import {
    Sparkles,
    TrendingUp,
    ChevronRight,
    Zap,
    Target,
    Lightbulb,
    Brain,
    BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AiInsightsDashboard } from '@/components/ai-insights-dashboard';
import { CompetitorTracker } from '@/components/competitor-tracker';

const iconMap: Record<string, any> = {
    TrendingUp,
    Zap,
    Target
};

export default function StrategyView({ initialStrategies }: { initialStrategies: any[] }) {
    const [strategies] = useState(initialStrategies);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">AI Strategy</h1>
                        <p className="text-muted-foreground text-sm">Predictive tactical advice for your brands.</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="insights" className="w-full">
                <TabsList className="bg-white/5 border border-white/10 mb-6">
                    <TabsTrigger value="insights" className="gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                        <Brain className="w-4 h-4" />
                        AI Insights
                    </TabsTrigger>
                    <TabsTrigger value="competitors" className="gap-2 data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400">
                        <Target className="w-4 h-4" />
                        Competitors
                    </TabsTrigger>
                    <TabsTrigger value="strategies" className="gap-2 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400">
                        <BarChart3 className="w-4 h-4" />
                        Strategies
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="insights">
                    <AiInsightsDashboard />
                </TabsContent>

                <TabsContent value="competitors">
                    <CompetitorTracker />
                </TabsContent>

                <TabsContent value="strategies">
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <Button variant="outline" className="premium-button border-glass-border">
                                Regenerate Strategy
                            </Button>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {strategies.map((strat, i) => (
                                <div key={i} className="premium-card p-6 flex flex-col group border-indigo-500/10 hover:border-indigo-500/30 transition-all">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`p-2 rounded-xl bg-white/5 ${strat.color}`}>
                                            {strat.icon && (iconMap[strat.icon] ?
                                                (iconMap[strat.icon] as any)({ className: 'h-6 w-6' }) :
                                                <Zap className="h-6 w-6" />
                                            )}
                                        </div>
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-none text-[10px] font-bold">
                                            ROI: {strat.roi}
                                        </Badge>
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">{strat.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                                        {strat.description}
                                    </p>
                                    <Button className="w-full bg-white/5 hover:bg-white/10 border border-glass-border group-hover:bg-indigo-500 group-hover:text-white transition-all text-xs h-9">
                                        Execute Action <ChevronRight className="h-3 w-3 ml-2" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="premium-card p-8 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent border-indigo-500/20">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-2xl bg-white/5 text-indigo-400">
                                    <Lightbulb className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold mb-2">Morning Briefing</h2>
                                    <p className="text-muted-foreground leading-relaxed max-w-2xl">
                                        &quot;Your brand voice is shifting towards <span className="text-white font-semibold">Technical/Authoritative</span>. To maintain balance, I recommend adding 2-3 <span className="text-white font-semibold">Behind-the-scenes</span> posts this week. Your top follower segment (Engineers) responds best to raw process shots.&quot;
                                    </p>
                                    <div className="mt-6 flex gap-3">
                                        <Button size="sm" className="bg-primary text-xs h-9 px-6">Create Drafts</Button>
                                        <Button variant="ghost" size="sm" className="text-xs h-9 px-6 text-muted-foreground hover:text-foreground">Ignore Suggestion</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

