'use client';

import { useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Eye,
    Heart,
    MessageSquare,
    Share2,
    Users,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mini line chart component
function MiniChart({
    data,
    color = '#8B5CF6',
    height = 40
}: {
    data: number[];
    color?: string;
    height?: number;
}) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = height - ((value - min) / range) * (height - 4);
        return `${x},${y}`;
    }).join(' ');

    const areaPoints = `0,${height} ${points} 100,${height}`;

    return (
        <svg width="100%" height={height} className="overflow-visible">
            <defs>
                <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline
                fill={`url(#gradient-${color.replace('#', '')})`}
                stroke="none"
                points={areaPoints}
            />
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
}

// Bar chart component
function BarChart({
    data,
    labels,
    color = '#8B5CF6',
    height = 120
}: {
    data: number[];
    labels: string[];
    color?: string;
    height?: number;
}) {
    const max = Math.max(...data);

    return (
        <div className="flex items-end justify-between gap-1" style={{ height }}>
            {data.map((value, index) => {
                const barHeight = (value / max) * 100;
                return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${barHeight}%` }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            className="w-full rounded-t-sm"
                            style={{ backgroundColor: color, opacity: 0.7 + (value / max) * 0.3 }}
                        />
                        <span className="text-[10px] text-gray-500">{labels[index]}</span>
                    </div>
                );
            })}
        </div>
    );
}

// Donut chart component
function DonutChart({
    data,
    colors,
    size = 100
}: {
    data: { label: string; value: number }[];
    colors: string[];
    size?: number;
}) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const radius = size / 2 - 10;
    const circumference = 2 * Math.PI * radius;

    const segments = data.map((item, index) => {
        const percentage = item.value / total;
        const dashLength = circumference * percentage;
        const offset = data
            .slice(0, index)
            .reduce((sum, prev) => sum + (circumference * prev.value) / total, 0);
        const dashOffset = circumference - offset;

        return {
            ...item,
            color: colors[index % colors.length],
            dashArray: `${dashLength} ${circumference}`,
            dashOffset,
            percentage: Math.round(percentage * 100)
        };
    });

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                {segments.map((segment, index) => (
                    <circle
                        key={index}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="12"
                        strokeDasharray={segment.dashArray}
                        strokeDashoffset={segment.dashOffset}
                        strokeLinecap="round"
                    />
                ))}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-xl font-bold">{total.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400">Total</div>
                </div>
            </div>
        </div>
    );
}

// Stat card component
function StatCard({
    title,
    value,
    change,
    changeLabel,
    icon: Icon,
    chartData,
    color = '#8B5CF6'
}: {
    title: string;
    value: string | number;
    change: number;
    changeLabel: string;
    icon: any;
    chartData: number[];
    color?: string;
}) {
    const isPositive = change >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl p-5"
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                        <Icon className="w-4 h-4" style={{ color }} />
                        {title}
                    </div>
                    <div className="text-2xl font-bold">{value}</div>
                </div>
                <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {isPositive ? '+' : ''}{change}%
                </div>
            </div>

            <MiniChart data={chartData} color={color} height={40} />

            <div className="text-[10px] text-gray-500 mt-2">{changeLabel}</div>
        </motion.div>
    );
}

interface PredictiveAnalyticsProps {
    brandId?: string;
    data?: any;
}

export function PredictiveAnalytics({ brandId, data }: PredictiveAnalyticsProps) {
    const stats = useMemo(() => ({
        reach: {
            current: data?.currentMetrics?.reach || 125400,
            change: 12.5,
            data: data?.trends?.reach || [42000, 48000, 45000, 52000, 58000, 55000, 62000, 68000, 72000, 78000, 85000, 92000, 98000, 105000, 112000, 118000, 125400]
        },
        engagement: {
            current: data?.currentMetrics?.engagement || 8420,
            change: 8.2,
            data: data?.trends?.engagement || [2800, 3100, 2900, 3400, 3800, 3600, 4200, 4500, 4800, 5200, 5800, 6100, 6800, 7200, 7800, 8100, 8420]
        },
        followers: {
            current: data?.currentMetrics?.followers || 24680,
            change: 5.4,
            data: data?.trends?.followers || [18000, 18500, 19000, 19400, 19900, 20300, 20800, 21200, 21700, 22100, 22600, 23000, 23500, 23900, 24200, 24500, 24680]
        },
        shares: {
            current: data?.currentMetrics?.shares || 1840,
            change: -2.3,
            data: [2100, 2000, 1950, 2050, 1980, 1900, 1850, 1920, 1880, 1820, 1790, 1850, 1800, 1780, 1820, 1860, 1840]
        }
    }), [data]);

    const platformBreakdown = useMemo(() => (
        data?.platformBreakdown?.map((p: any) => ({ label: p.platform, value: p.value })) || [
            { label: 'Twitter', value: 35000 },
            { label: 'Instagram', value: 28000 },
            { label: 'LinkedIn', value: 22000 },
            { label: 'Facebook', value: 18000 },
            { label: 'TikTok', value: 12000 }
        ]
    ), [data]);

    const weeklyEngagement = useMemo(() => ({
        data: [3200, 4100, 3800, 5200, 4800, 3500, 2900],
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }), []);

    const predictions = useMemo(() => ({
        nextWeekReach: data?.predictions?.nextWeekReach || 142000,
        nextWeekEngagement: data?.predictions?.nextWeekEngagement || 9200,
        bestPostTime: data?.predictions?.bestPostTime || 'Thursday, 2:00 PM',
        suggestedContentType: data?.predictions?.suggestedContentType || 'Video Carousel',
        confidence: data?.predictions?.confidence || 87
    }), [data]);

    const contentPerformance = useMemo(() => ([
        { type: 'Video', engagement: 4.8, reach: 45000 },
        { type: 'Carousel', engagement: 3.9, reach: 38000 },
        { type: 'Image', engagement: 2.4, reach: 25000 },
        { type: 'Text', engagement: 1.8, reach: 17000 }
    ]), []);

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Reach"
                    value={stats.reach.current.toLocaleString()}
                    change={stats.reach.change}
                    changeLabel="vs last 30 days"
                    icon={Eye}
                    chartData={stats.reach.data}
                    color="#8B5CF6"
                />
                <StatCard
                    title="Engagement"
                    value={stats.engagement.current.toLocaleString()}
                    change={stats.engagement.change}
                    changeLabel="vs last 30 days"
                    icon={Heart}
                    chartData={stats.engagement.data}
                    color="#EC4899"
                />
                <StatCard
                    title="Followers"
                    value={stats.followers.current.toLocaleString()}
                    change={stats.followers.change}
                    changeLabel="vs last 30 days"
                    icon={Users}
                    chartData={stats.followers.data}
                    color="#10B981"
                />
                <StatCard
                    title="Shares"
                    value={stats.shares.current.toLocaleString()}
                    change={stats.shares.change}
                    changeLabel="vs last 30 days"
                    icon={Share2}
                    chartData={stats.shares.data}
                    color="#F59E0B"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Engagement Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-6"
                >
                    <h3 className="font-semibold mb-6">Weekly Engagement</h3>
                    <BarChart
                        data={weeklyEngagement.data}
                        labels={weeklyEngagement.labels}
                        color="#8B5CF6"
                        height={140}
                    />
                </motion.div>

                {/* Platform Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6"
                >
                    <h3 className="font-semibold mb-4">Reach by Platform</h3>
                    <div className="flex items-center justify-center mb-4">
                        <DonutChart
                            data={platformBreakdown}
                            colors={['#1DA1F2', '#E1306C', '#0A66C2', '#1877F2', '#000000']}
                            size={120}
                        />
                    </div>
                    <div className="space-y-2">
                        {platformBreakdown.map((platform: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: ['#1DA1F2', '#E1306C', '#0A66C2', '#1877F2', '#000000'][i] }}
                                    />
                                    <span className="text-gray-400">{platform.label}</span>
                                </div>
                                <span className="font-medium">{(platform.value / 1000).toFixed(1)}K</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* AI Predictions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-xl p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                        AI Predictions for Next Week
                    </h3>
                    <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">
                        {predictions.confidence}% confidence
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-xs text-gray-400 mb-1">Predicted Reach</div>
                        <div className="text-xl font-bold text-purple-300">
                            {predictions.nextWeekReach.toLocaleString()}
                        </div>
                        <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                            <ArrowUpRight className="w-3 h-3" />
                            +13.2% growth
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-xs text-gray-400 mb-1">Predicted Engagement</div>
                        <div className="text-xl font-bold text-purple-300">
                            {predictions.nextWeekEngagement.toLocaleString()}
                        </div>
                        <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                            <ArrowUpRight className="w-3 h-3" />
                            +9.3% growth
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-xs text-gray-400 mb-1">Best Post Time</div>
                        <div className="text-lg font-bold text-purple-300">
                            {predictions.bestPostTime}
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-xs text-gray-400 mb-1">Suggested Format</div>
                        <div className="text-lg font-bold text-purple-300">
                            {predictions.suggestedContentType}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Content Type Performance */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
            >
                <h3 className="font-semibold mb-4">Content Type Performance</h3>
                <div className="space-y-4">
                    {contentPerformance.map((content, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-20 text-sm text-gray-400">{content.type}</div>
                            <div className="flex-1">
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(content.engagement / 5) * 100}%` }}
                                        transition={{ duration: 0.5, delay: i * 0.1 }}
                                        className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full"
                                    />
                                </div>
                            </div>
                            <div className="w-24 text-right">
                                <span className="text-sm font-medium">{content.engagement}%</span>
                                <span className="text-xs text-gray-500 ml-1">eng rate</span>
                            </div>
                            <div className="w-20 text-right text-sm text-gray-400">
                                {(content.reach / 1000).toFixed(0)}K reach
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
