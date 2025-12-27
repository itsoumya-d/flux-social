'use client';

import { useState, useMemo } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Download, Smartphone, LayoutGrid, Type } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface AnalyticsDashboardProps {
    growthData: {
        dates: string[];
        reachTrend: number[];
        engagementTrend: number[];
        platformSplit: { platform: string; value: number }[];
    } | null;
    contentPerformance: { type: string; count: number; avgEngagement: number }[];
    platformComparison: { platform: string; reach: number; engagement: number }[];
    onDateRangeChange: (start: Date, end: Date) => void;
}

export function AnalyticsDashboard({
    growthData,
    contentPerformance,
    platformComparison,
    onDateRangeChange
}: AnalyticsDashboardProps) {
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [activemetric, setActiveMetric] = useState<'reach' | 'engagement'>('reach');

    const chartData = useMemo(() => {
        if (!growthData || !growthData.dates) return [];
        return growthData.dates.map((date, i) => ({
            date: format(new Date(date), 'MMM dd'),
            reach: growthData.reachTrend[i] || 0,
            engagement: growthData.engagementTrend[i] || 0
        }));
    }, [growthData]);

    const handleRangeChange = (value: string) => {
        const today = new Date();
        let start = new Date();

        if (value === '7d') start = subDays(today, 7);
        if (value === '30d') start = subDays(today, 30);
        if (value === '90d') start = subDays(today, 90);

        setDateRange(value as any);
        onDateRangeChange(start, today);
    };

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Select value={dateRange} onValueChange={handleRangeChange}>
                        <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                            <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="90d">Last 90 Days</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                    </Select>

                    {dateRange === 'custom' && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal bg-white/5 border-white/10",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                </div>

                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                    <button
                        onClick={() => setActiveMetric('reach')}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                            activemetric === 'reach' ? "bg-indigo-500 text-white shadow-lg" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        Reach
                    </button>
                    <button
                        onClick={() => setActiveMetric('engagement')}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                            activemetric === 'engagement' ? "bg-emerald-500 text-white shadow-lg" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        Engagement
                    </button>
                </div>
            </div>

            {/* Main Trend Chart */}
            <Card className="premium-card bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="text-lg">Growth Trends</CardTitle>
                    <CardDescription>Performance over time for {dateRange === 'custom' ? 'selected period' : `last ${dateRange.replace('d', ' days')}`}</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis
                                dataKey="date"
                                stroke="#ffffff40"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#ffffff40"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area
                                type="monotone"
                                dataKey={activemetric}
                                stroke={activemetric === 'reach' ? '#6366f1' : '#10b981'}
                                fillOpacity={1}
                                fill={`url(#color${activemetric === 'reach' ? 'Reach' : 'Eng'})`}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Content Performance */}
                <Card className="premium-card bg-white/5 border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Type className="h-4 w-4 text-amber-500" />
                            Content Strategy
                        </CardTitle>
                        <CardDescription>Comparing format effectiveness</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={contentPerformance} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff10" />
                                <XAxis type="number" stroke="#ffffff40" fontSize={10} hide />
                                <YAxis dataKey="type" type="category" stroke="#ffffff80" fontSize={12} width={60} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#ffffff10' }}
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                />
                                <Bar dataKey="avgEngagement" name="Avg. Engagement" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Platform Split */}
                <Card className="premium-card bg-white/5 border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <LayoutGrid className="h-4 w-4 text-pink-500" />
                            Platform Impact
                        </CardTitle>
                        <CardDescription>Where your audience lives</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={platformComparison}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="reach"
                                >
                                    {platformComparison.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
