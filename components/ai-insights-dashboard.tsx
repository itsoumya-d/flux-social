'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    Sparkles,
    TrendingUp,
    TrendingDown,
    Calendar,
    Clock,
    Target,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    Eye,
    Heart,
    MessageSquare,
    Share2,
    Lightbulb,
    RefreshCw,
    Brain
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mock AI insights data
const mockInsights = {
    overallScore: 87,
    scoreChange: 5,
    bestPostingTimes: [
        { day: 'Tuesday', time: '10:00 AM', engagementBoost: '+34%' },
        { day: 'Thursday', time: '2:00 PM', engagementBoost: '+28%' },
        { day: 'Saturday', time: '11:00 AM', engagementBoost: '+22%' },
    ],
    contentRecommendations: [
        { type: 'Video', current: 15, recommended: 40, reason: "Videos get 2.5x more engagement than images" },
        { type: 'Carousel', current: 10, recommended: 25, reason: "Carousel posts have highest save rates" },
        { type: 'Stories', current: 20, recommended: 35, reason: "Stories drive profile visits" },
    ],
    predictedMetrics: {
        nextWeekReach: 45000,
        nextWeekEngagement: 3200,
        confidence: 85,
    },
    trendingTopics: [
        { topic: 'AI in Social Media', relevance: 95, trending: 'up' },
        { topic: 'Creator Economy', relevance: 88, trending: 'up' },
        { topic: 'Short-form Video', relevance: 82, trending: 'stable' },
        { topic: 'Community Building', relevance: 76, trending: 'up' },
    ],
    audienceInsights: {
        peakActivity: '9 AM - 12 PM EST',
        topLocations: ['United States', 'United Kingdom', 'Canada'],
        ageGroup: '25-34',
        interests: ['Technology', 'Marketing', 'Entrepreneurship'],
    },
};

interface AiInsightsDashboardProps {
    brandId?: string;
    data?: any;
}

export function AiInsightsDashboard({ brandId, data }: AiInsightsDashboardProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const insights = useMemo(() => ({
        overallScore: 87,
        scoreChange: 5,
        bestPostingTimes: [
            { day: 'Tuesday', time: '10:00 AM', engagementBoost: '+34%' },
            { day: 'Thursday', time: '2:00 PM', engagementBoost: '+28%' },
            { day: 'Saturday', time: '11:00 AM', engagementBoost: '+22%' },
        ],
        contentRecommendations: [
            { type: 'Video', current: 15, recommended: 40, reason: "Videos get 2.5x more engagement than images" },
            { type: 'Carousel', current: 10, recommended: 25, reason: "Carousel posts have highest save rates" },
            { type: 'Stories', current: 20, recommended: 35, reason: "Stories drive profile visits" },
        ],
        predictedMetrics: {
            nextWeekReach: data?.predictions?.nextWeekReach || 45000,
            nextWeekEngagement: data?.predictions?.nextWeekEngagement || 3200,
            confidence: data?.predictions?.confidence || 85,
        },
        trendingTopics: [
            { topic: 'AI in Social Media', relevance: 95, trending: 'up' },
            { topic: 'Creator Economy', relevance: 88, trending: 'up' },
            { topic: 'Short-form Video', relevance: 82, trending: 'stable' },
            { topic: 'Community Building', relevance: 76, trending: 'up' },
        ],
        audienceInsights: {
            peakActivity: '9 AM - 12 PM EST',
            topLocations: ['United States', 'United Kingdom', 'Canada'],
            ageGroup: '25-34',
            interests: ['Technology', 'Marketing', 'Entrepreneurship'],
        },
    }), [data]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await new Promise(r => setTimeout(r, 2000));
        setIsRefreshing(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Brain className="w-6 h-6 text-purple-400" />
                        AI Strategy Insights
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        AI-powered recommendations to optimize your social strategy
                    </p>
                </div>
                <Button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    variant="outline"
                    className="gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Analyzing...' : 'Refresh Insights'}
                </Button>
            </div>

            {/* Performance Score */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-1 bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30 rounded-xl p-6"
                >
                    <div className="text-center">
                        <div className="text-sm text-purple-300 mb-2">Content Health Score</div>
                        <div className="relative w-32 h-32 mx-auto mb-4">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle
                                    cx="50" cy="50" r="45"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="8"
                                />
                                <circle
                                    cx="50" cy="50" r="45"
                                    fill="none"
                                    stroke="url(#gradient)"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${insights.overallScore * 2.83} 283`}
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#8B5CF6" />
                                        <stop offset="100%" stopColor="#D946EF" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-4xl font-bold">{insights.overallScore}</span>
                            </div>
                        </div>
                        <div className={`flex items-center justify-center gap-1 text-sm ${insights.scoreChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                            {insights.scoreChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {insights.scoreChange >= 0 ? '+' : ''}{insights.scoreChange} points this week
                        </div>
                    </div>
                </motion.div>

                {/* Predicted Metrics */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <h3 className="font-semibold">Next Week Predictions</h3>
                        <span className="text-xs text-gray-400 ml-auto">
                            {insights.predictedMetrics.confidence}% confidence
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                                <Eye className="w-4 h-4" />
                                Predicted Reach
                            </div>
                            <div className="text-2xl font-bold">
                                {insights.predictedMetrics.nextWeekReach.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1 text-emerald-400 text-xs mt-1">
                                <ArrowUpRight className="w-3 h-3" />
                                +12% vs last week
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                                <Heart className="w-4 h-4" />
                                Predicted Engagement
                            </div>
                            <div className="text-2xl font-bold">
                                {insights.predictedMetrics.nextWeekEngagement.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1 text-emerald-400 text-xs mt-1">
                                <ArrowUpRight className="w-3 h-3" />
                                +8% vs last week
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Best Posting Times & Content Mix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Optimal Posting Times */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <h3 className="font-semibold">Optimal Posting Times</h3>
                    </div>

                    <div className="space-y-3">
                        {insights.bestPostingTimes.map((slot: any, i: number) => (
                            <div
                                key={i}
                                className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <div className="font-medium">{slot.day}</div>
                                        <div className="text-sm text-gray-400">{slot.time}</div>
                                    </div>
                                </div>
                                <span className="text-emerald-400 text-sm font-semibold">
                                    {slot.engagementBoost}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Content Mix Recommendations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-semibold">Content Mix Optimization</h3>
                    </div>

                    <div className="space-y-4">
                        {insights.contentRecommendations.map((rec: any, i: number) => (
                            <div key={i}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span>{rec.type}</span>
                                    <span className="text-gray-400">
                                        {rec.current}% → {rec.recommended}%
                                    </span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                                    <div
                                        className="bg-gray-500 h-full"
                                        style={{ width: `${rec.current}%` }}
                                    />
                                    <div
                                        className="bg-emerald-500/50 h-full"
                                        style={{ width: `${rec.recommended - rec.current}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{rec.reason}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Trending Topics */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h3 className="font-semibold">Trending Topics for Your Audience</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {insights.trendingTopics.map((topic: any, i: number) => (
                        <div
                            key={i}
                            className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${topic.trending === 'up' ? 'bg-emerald-500/20 text-emerald-400' :
                                    topic.trending === 'down' ? 'bg-red-500/20 text-red-400' :
                                        'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {topic.trending === 'up' ? '↑ Rising' :
                                        topic.trending === 'down' ? '↓ Falling' : '→ Stable'}
                                </span>
                            </div>
                            <div className="font-medium text-sm">{topic.topic}</div>
                            <div className="text-xs text-gray-400 mt-1">
                                {topic.relevance}% relevance
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Audience Insights */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold">Audience Intelligence</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div className="text-xs text-gray-400 mb-1">Peak Activity</div>
                        <div className="font-semibold">{insights.audienceInsights.peakActivity}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 mb-1">Primary Age Group</div>
                        <div className="font-semibold">{insights.audienceInsights.ageGroup}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 mb-1">Top Locations</div>
                        <div className="font-semibold">{insights.audienceInsights.topLocations[0]}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 mb-1">Top Interests</div>
                        <div className="font-semibold">{insights.audienceInsights.interests[0]}</div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
