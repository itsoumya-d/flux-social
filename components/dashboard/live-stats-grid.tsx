"use client";

import { useRealtimeStatus } from "@/components/realtime-provider";
import { useLiveAnalytics } from "@/lib/hooks/use-live-analytics";
import { SparklineCard } from "@/components/sparkline-card";
import { Users, TrendingUp, Send, BarChart3 } from "lucide-react";

export function LiveStatsGrid({ initialStats, brandId }: { initialStats: any, brandId: string }) {
    const { isEnabled } = useRealtimeStatus();

    if (isEnabled && brandId) {
        return <ConnectedStats brandId={brandId} initialStats={initialStats} />;
    }

    return <StatsCards stats={initialStats} />;
}

function ConnectedStats({ brandId, initialStats }: { brandId: string, initialStats: any }) {
    const { stats } = useLiveAnalytics(brandId, initialStats);
    return <StatsCards stats={stats} />;
}

function StatsCards({ stats }: { stats: any }) {
    // Generate dummy sparkline data for now since we don't have historical data passed in yet for sparklines
    // In a real app complexity, we'd pass this in `initialStats` too.
    const dummyData = [40, 30, 45, 80, 55, 60, 45, 90, 100];

    const cards = [
        {
            label: 'Total Reach',
            value: stats.reach > 1000 ? `${(stats.reach / 1000).toFixed(1)}K` : stats.reach.toString(),
            trend: '+12.5%',
            isUp: true,
            icon: Users,
            color: 'text-blue-500',
            data: [20, 40, 30, 70, 45, 90, 120]
        },
        {
            label: 'Engagement',
            value: stats.engagement.toString(),
            trend: '+2.1%',
            isUp: true,
            icon: TrendingUp,
            color: 'text-indigo-500',
            data: [10, 20, 15, 30, 25, 45, 50]
        },
        {
            label: 'Active Posts',
            value: stats.posts.toString(),
            trend: '+0',
            isUp: true,
            icon: Send,
            color: 'text-violet-500',
            data: [5, 5, 6, 8, 8, 9, 10]
        },
        {
            label: 'Total Clicks',
            value: stats.clicks.toString(),
            trend: '+15.2%',
            isUp: true,
            icon: BarChart3,
            color: 'text-fuchsia-500',
            data: [50, 60, 55, 80, 70, 95, 110]
        },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, i) => (
                <SparklineCard
                    key={i}
                    title={card.label}
                    value={card.value}
                    trend={card.trend}
                    isUp={card.isUp}
                    icon={card.icon}
                    color={card.color}
                    data={card.data}
                />
            ))}
        </div>
    );
}
