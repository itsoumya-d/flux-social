"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface SparklineCardProps {
    title: string;
    value: string | number;
    trend: string;
    description?: string;
    data: number[];
    isUp?: boolean;
    icon?: any;
    color?: string; // Tailwind text color class, e.g. "text-blue-500"
}

export function SparklineCard({
    title,
    value,
    trend,
    data,
    isUp = true,
    icon: Icon,
    color = "text-primary"
}: SparklineCardProps) {

    // Normalize data for chart
    const chartData = data.map((val, i) => ({ i, val }));

    // Extract color hex approximation from tailwind class or use a default
    const strokeColor = isUp ? "#10b981" : "#f43f5e"; // emerald-500 : rose-500
    const fillColor = isUp ? "#10b981" : "#f43f5e";

    return (
        <div className="premium-card p-6 relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-4 z-10 relative">
                <div className={cn("p-2 rounded-xl bg-white/5", color)}>
                    {Icon && <Icon className="h-6 w-6" />}
                </div>
                <div className={cn("flex items-center text-xs font-medium px-2 py-1 rounded-full bg-white/5", isUp ? 'text-emerald-500' : 'text-rose-500')}>
                    {isUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {trend}
                </div>
            </div>

            <div className="relative z-10">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
            </div>

            {/* Sparkline Chart */}
            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 group-hover:opacity-30 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={fillColor} stopOpacity={0.5} />
                                <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="val"
                            stroke={strokeColor}
                            strokeWidth={2}
                            fill={`url(#gradient-${title})`}
                            isAnimationActive={true}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
