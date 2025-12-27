'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    MessageCircle,
    ThumbsUp,
    ThumbsDown,
    Minus,
    AlertTriangle,
    Star,
    ExternalLink,
    MessageSquare,
    Filter,
    RefreshCw,
    TrendingUp,
    Users,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SocialMention } from '@/lib/types';

// Mock data for demonstration
const mockMentions = [
    {
        id: '1',
        platform: 'twitter',
        content: 'Just tried @FluxSocial and it\'s amazing! The AI features are exactly what I needed for my business.',
        author_name: 'Sarah Chen',
        author_handle: '@sarahchen',
        author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        author_followers: 12500,
        sentiment: 'positive',
        sentiment_score: 0.85,
        is_influencer: true,
        requires_response: false,
        discovered_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
        id: '2',
        platform: 'instagram',
        content: 'Having trouble connecting my Instagram account to FluxSocial. Anyone else experiencing this?',
        author_name: 'Mike Johnson',
        author_handle: '@mikej_photos',
        author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
        author_followers: 4200,
        sentiment: 'negative',
        sentiment_score: -0.4,
        is_influencer: false,
        requires_response: true,
        discovered_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
        id: '3',
        platform: 'linkedin',
        content: 'Interesting new social media management tool - FluxSocial. Worth checking out for marketing teams.',
        author_name: 'David Park',
        author_handle: 'davidpark',
        author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
        author_followers: 8900,
        sentiment: 'neutral',
        sentiment_score: 0.2,
        is_influencer: false,
        requires_response: false,
        discovered_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    },
    {
        id: '4',
        platform: 'twitter',
        content: 'The scheduling feature in FluxSocial saved me hours this week! Highly recommend for content creators.',
        author_name: 'Emma Wilson',
        author_handle: '@emmawilson',
        author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
        author_followers: 45000,
        sentiment: 'positive',
        sentiment_score: 0.92,
        is_influencer: true,
        requires_response: false,
        discovered_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
];

const platformColors: Record<string, string> = {
    twitter: '#1DA1F2',
    instagram: '#E1306C',
    linkedin: '#0A66C2',
    facebook: '#1877F2',
    tiktok: '#000000',
};

const sentimentConfig = {
    positive: { icon: ThumbsUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Positive' },
    negative: { icon: ThumbsDown, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Negative' },
    neutral: { icon: Minus, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Neutral' },
    mixed: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Mixed' },
};

function formatTimeAgo(dateString: string): string {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

import { getSocialMentions, getMentionStats, checkCrisisAlerts, getReputationScore } from '@/app/actions/social-listening';

interface SocialListeningProps {
    brandId?: string;
}

export function SocialListening({ brandId }: SocialListeningProps) {
    const [mentions, setMentions] = useState<any[]>(mockMentions);
    const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'requires_response'>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [crisisAlert, setCrisisAlert] = useState<any>(null);
    const [reputationScore, setReputationScore] = useState(85);
    const [stats, setStats] = useState({
        total: 47,
        positive: 28,
        negative: 8,
        neutral: 11,
        influencerMentions: 5,
        requiresResponse: 3,
    });

    const filteredMentions = useMemo(() => {
        return mentions.filter(m => {
            if (filter === 'all') return true;
            if (filter === 'requires_response') return m.requires_response;
            return m.sentiment === filter;
        });
    }, [mentions, filter]);

    useEffect(() => {
        if (brandId) {
            refreshData();
        }
    }, [brandId]);

    const refreshData = async () => {
        if (!brandId) return;
        setIsLoading(true);
        try {
            const [mentionsData, statsData, crisisData, scoreData] = await Promise.all([
                getSocialMentions(brandId),
                getMentionStats(brandId),
                checkCrisisAlerts(brandId),
                getReputationScore(brandId)
            ]);

            if (mentionsData.mentions.length > 0) {
                setMentions(mentionsData.mentions);
            }
            if (statsData) {
                setStats(statsData);
            }
            setCrisisAlert(crisisData.isCrisis ? crisisData : null);
            setReputationScore(scoreData);
        } catch (error) {
            console.error('Failed to refresh listening data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        await refreshData();
    };

    const handleGenerateResponse = async (mentionId: string) => {
        console.log('Generating response for mention:', mentionId);
    };

    return (
        <div className="space-y-6">
            {/* Crisis Guard Banner */}
            <AnimatePresence>
                {crisisAlert && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-rose-500/20 border border-rose-500/50 rounded-xl p-4 flex items-center justify-between shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-500 rounded-lg animate-pulse shadow-lg shadow-rose-500/40">
                                    <AlertTriangle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-rose-400">CRISIS GUARD ALERT</h3>
                                    <p className="text-sm text-rose-300/80">
                                        Negative sentiment has spiked by <span className="font-bold">+{crisisAlert.increasePercentage}%</span> in the last hour.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {crisisAlert.themes?.map((t: any, i: number) => (
                                    <Badge key={i} variant="outline" className="bg-rose-500/10 border-rose-500/30 text-rose-300">
                                        {t.theme} ({t.count})
                                    </Badge>
                                ))}
                                <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white border-none ml-4">
                                    Strategic Response
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Reputation Score Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 col-span-2 md:col-span-1 lg:col-span-1 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1 relative">
                        <Star className="w-4 h-4 text-amber-400" />
                        Reputation Score
                    </div>
                    <div className="text-4xl font-bold tracking-tighter relative">
                        {reputationScore}
                        <span className="text-xs text-muted-foreground ml-1">/100</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${reputationScore}%` }}
                            className={cn(
                                "h-full shadow-[0_0_10px_rgba(var(--score-color))]",
                                reputationScore > 80 ? "bg-emerald-500" : reputationScore > 50 ? "bg-amber-500" : "bg-rose-500"
                            )}
                        />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
                >
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                        <MessageCircle className="w-4 h-4" />
                        Total Mentions
                    </div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3" /> +12% this week
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
                >
                    <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
                        <ThumbsUp className="w-4 h-4" />
                        Positive
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">{stats.positive}</div>
                    <div className="text-xs text-gray-400 mt-1">
                        {Math.round((stats.positive / (stats.total || 1)) * 100)}% of total
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
                >
                    <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
                        <ThumbsDown className="w-4 h-4" />
                        Negative
                    </div>
                    <div className="text-2xl font-bold text-red-400">{stats.negative}</div>
                    <div className="text-xs text-gray-400 mt-1">
                        {Math.round((stats.negative / (stats.total || 1)) * 100)}% of total
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white/5 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4"
                >
                    <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        Needs Response
                    </div>
                    <div className="text-2xl font-bold text-amber-400">{stats.requiresResponse}</div>
                </motion.div>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
                        {(['all', 'positive', 'negative', 'requires_response'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-md text-sm transition-all ${filter === f
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {f === 'requires_response' ? 'Needs Response' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Mentions Feed */}
            <div className="space-y-4">
                <AnimatePresence>
                    {filteredMentions.map((mention: any, index: number) => {
                        const sentimentInfo = sentimentConfig[mention.sentiment as keyof typeof sentimentConfig];
                        const SentimentIcon = sentimentInfo.icon;

                        return (
                            <motion.div
                                key={mention.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.05 }}
                                className={`bg-white/5 backdrop-blur-sm border rounded-xl p-5 ${mention.requires_response
                                    ? 'border-amber-500/30'
                                    : mention.is_influencer
                                        ? 'border-purple-500/30'
                                        : 'border-white/10'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <Avatar className="w-12 h-12">
                                            <AvatarImage src={mention.author_avatar} alt={mention.author_name} />
                                            <AvatarFallback>{mention.author_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div
                                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ring-2 ring-black"
                                            style={{ backgroundColor: platformColors[mention.platform] }}
                                        >
                                            {mention.platform[0].toUpperCase()}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-white">
                                                {mention.author_name}
                                            </span>
                                            <span className="text-gray-400 text-sm">
                                                {mention.author_handle}
                                            </span>
                                            {mention.is_influencer && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                                                    <Star className="w-3 h-3" />
                                                    Influencer
                                                </span>
                                            )}
                                            <span className="text-gray-500 text-sm ml-auto">
                                                {formatTimeAgo(mention.discovered_at)}
                                            </span>
                                        </div>

                                        <p className="text-gray-300 mb-3">{mention.content}</p>

                                        <div className="flex items-center gap-4">
                                            {/* Sentiment Badge */}
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${sentimentInfo.bg}`}>
                                                <SentimentIcon className={`w-4 h-4 ${sentimentInfo.color}`} />
                                                <span className={`text-sm ${sentimentInfo.color}`}>
                                                    {sentimentInfo.label}
                                                </span>
                                            </div>

                                            {/* Followers */}
                                            <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                                                <Users className="w-4 h-4" />
                                                {mention.author_followers.toLocaleString()} followers
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 ml-auto">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="gap-1.5 text-gray-400 hover:text-white"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    View
                                                </Button>

                                                {mention.requires_response && (
                                                    <Button
                                                        size="sm"
                                                        className="gap-1.5 bg-gradient-to-r from-violet-500 to-purple-500"
                                                        onClick={() => handleGenerateResponse(mention.id)}
                                                    >
                                                        <Sparkles className="w-4 h-4" />
                                                        AI Response
                                                    </Button>
                                                )}

                                                {!mention.requires_response && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1.5"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                        Reply
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {filteredMentions.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No mentions found matching your filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
