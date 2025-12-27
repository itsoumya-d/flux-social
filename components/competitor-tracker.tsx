'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Target,
    Plus,
    TrendingUp,
    TrendingDown,
    Minus,
    Users,
    BarChart3,
    Sparkles,
    ExternalLink,
    Trash2,
    Twitter,
    Instagram,
    Linkedin,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Mock data for demonstration
const mockCompetitors = [
    {
        id: '1',
        name: 'Hootsuite',
        handles: { twitter: '@hootsuite', instagram: '@hootsuite', linkedin: 'hootsuite' },
        website_url: 'https://hootsuite.com',
        metrics: {
            followers: 1250000,
            followersChange: 2.3,
            engagementRate: 3.8,
            postsPerWeek: 21,
        },
    },
    {
        id: '2',
        name: 'Buffer',
        handles: { twitter: '@buffer', instagram: '@buffer', linkedin: 'buffer' },
        website_url: 'https://buffer.com',
        metrics: {
            followers: 890000,
            followersChange: -0.5,
            engagementRate: 4.2,
            postsPerWeek: 14,
        },
    },
    {
        id: '3',
        name: 'Sprout Social',
        handles: { twitter: '@sproutsocial', instagram: '@sproutsocial', linkedin: 'sproutsocial' },
        website_url: 'https://sproutsocial.com',
        metrics: {
            followers: 560000,
            followersChange: 1.8,
            engagementRate: 3.5,
            postsPerWeek: 18,
        },
    },
];

const mockInsights = {
    summary: "Your engagement rate (4.5%) outperforms the industry average. Focus on increasing posting frequency to match Hootsuite's 21 posts/week while maintaining quality.",
    strengths: [
        "Higher engagement rate than all tracked competitors",
        "Strong brand voice consistency across platforms",
        "Better response time to comments"
    ],
    opportunities: [
        "Increase video content (competitors average 40% video, you're at 15%)",
        "Expand LinkedIn presence (lowest follower count relative to competitors)",
        "Test posting during 6-8 PM slot (competitor peak engagement time)"
    ],
    threats: [
        "Hootsuite's aggressive content expansion in your niche",
        "Buffer's new AI features gaining traction"
    ],
    recommendations: [
        { text: "Create 3 carousel posts per week featuring user tips", priority: "high" },
        { text: "Launch a weekly Twitter Spaces session", priority: "medium" },
        { text: "Add Instagram Reels to content mix", priority: "high" }
    ]
};

interface CompetitorTrackerProps {
    brandId?: string;
}

export function CompetitorTracker({ brandId }: CompetitorTrackerProps) {
    const [competitors, setCompetitors] = useState(mockCompetitors);
    const [insights, setInsights] = useState(mockInsights);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCompetitor, setNewCompetitor] = useState({ name: '', twitter: '', instagram: '', linkedin: '' });

    const handleGenerateInsights = async () => {
        setIsGenerating(true);
        await new Promise(r => setTimeout(r, 2000));
        setIsGenerating(false);
        toast.success('Competitive insights generated!');
    };

    const handleAddCompetitor = () => {
        if (!newCompetitor.name.trim()) return;

        const competitor = {
            id: Date.now().toString(),
            name: newCompetitor.name,
            handles: {
                twitter: newCompetitor.twitter,
                instagram: newCompetitor.instagram,
                linkedin: newCompetitor.linkedin,
            },
            website_url: '',
            metrics: {
                followers: 0,
                followersChange: 0,
                engagementRate: 0,
                postsPerWeek: 0,
            },
        };

        setCompetitors(prev => [...prev, competitor]);
        setNewCompetitor({ name: '', twitter: '', instagram: '', linkedin: '' });
        setShowAddModal(false);
        toast.success(`${newCompetitor.name} added to tracking`);
    };

    const handleRemoveCompetitor = (id: string) => {
        setCompetitors(prev => prev.filter(c => c.id !== id));
        toast.success('Competitor removed');
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Target className="w-5 h-5 text-rose-400" />
                        Competitor Tracking
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Monitor competitor performance and discover opportunities
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleGenerateInsights}
                        disabled={isGenerating}
                        className="gap-2 bg-gradient-to-r from-violet-500 to-purple-500"
                    >
                        {isGenerating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4" />
                        )}
                        {isGenerating ? 'Analyzing...' : 'Generate Insights'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowAddModal(true)}
                        className="gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Competitor
                    </Button>
                </div>
            </div>

            {/* Competitor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                    {competitors.map((competitor, index) => (
                        <motion.div
                            key={competitor.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-lg">{competitor.name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        {competitor.handles.twitter && (
                                            <a
                                                href={`https://twitter.com/${competitor.handles.twitter.replace('@', '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#1DA1F2] hover:opacity-80"
                                            >
                                                <Twitter className="w-4 h-4" />
                                            </a>
                                        )}
                                        {competitor.handles.instagram && (
                                            <a
                                                href={`https://instagram.com/${competitor.handles.instagram.replace('@', '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#E1306C] hover:opacity-80"
                                            >
                                                <Instagram className="w-4 h-4" />
                                            </a>
                                        )}
                                        {competitor.handles.linkedin && (
                                            <a
                                                href={`https://linkedin.com/company/${competitor.handles.linkedin}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#0A66C2] hover:opacity-80"
                                            >
                                                <Linkedin className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveCompetitor(competitor.id)}
                                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 rounded-lg p-3">
                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                                        <Users className="w-3 h-3" />
                                        Followers
                                    </div>
                                    <div className="font-semibold">
                                        {competitor.metrics.followers.toLocaleString()}
                                    </div>
                                    <div className={`flex items-center gap-1 text-xs mt-0.5 ${competitor.metrics.followersChange > 0 ? 'text-emerald-400' :
                                            competitor.metrics.followersChange < 0 ? 'text-red-400' : 'text-gray-400'
                                        }`}>
                                        {competitor.metrics.followersChange > 0 ? <TrendingUp className="w-3 h-3" /> :
                                            competitor.metrics.followersChange < 0 ? <TrendingDown className="w-3 h-3" /> :
                                                <Minus className="w-3 h-3" />}
                                        {Math.abs(competitor.metrics.followersChange)}%
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-lg p-3">
                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                                        <BarChart3 className="w-3 h-3" />
                                        Engagement
                                    </div>
                                    <div className="font-semibold">
                                        {competitor.metrics.engagementRate}%
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        {competitor.metrics.postsPerWeek} posts/wk
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* AI Insights */}
            {insights && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-semibold">AI Competitive Insights</h3>
                    </div>

                    <p className="text-gray-300 mb-6">{insights.summary}</p>

                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                        {/* Strengths */}
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                            <h4 className="flex items-center gap-2 font-semibold text-emerald-400 mb-3">
                                <CheckCircle2 className="w-4 h-4" />
                                Strengths
                            </h4>
                            <ul className="space-y-2">
                                {insights.strengths.map((s, i) => (
                                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                        <ArrowUpRight className="w-3 h-3 text-emerald-400 mt-1 flex-shrink-0" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Opportunities */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                            <h4 className="flex items-center gap-2 font-semibold text-blue-400 mb-3">
                                <TrendingUp className="w-4 h-4" />
                                Opportunities
                            </h4>
                            <ul className="space-y-2">
                                {insights.opportunities.map((o, i) => (
                                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                        <ArrowUpRight className="w-3 h-3 text-blue-400 mt-1 flex-shrink-0" />
                                        {o}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Threats */}
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                            <h4 className="flex items-center gap-2 font-semibold text-amber-400 mb-3">
                                <AlertTriangle className="w-4 h-4" />
                                Threats
                            </h4>
                            <ul className="space-y-2">
                                {insights.threats.map((t, i) => (
                                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                        <AlertTriangle className="w-3 h-3 text-amber-400 mt-1 flex-shrink-0" />
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                        <h4 className="font-semibold mb-3">Recommended Actions</h4>
                        <div className="space-y-2">
                            {insights.recommendations.map((rec, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                                >
                                    <span className="text-sm text-gray-300">{rec.text}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                            rec.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {rec.priority}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Add Competitor Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-md"
                        >
                            <h3 className="text-lg font-semibold mb-4">Add Competitor</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">Company Name</label>
                                    <input
                                        type="text"
                                        value={newCompetitor.name}
                                        onChange={e => setNewCompetitor(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                                        placeholder="e.g., Hootsuite"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-sm text-gray-400 block mb-1">Twitter</label>
                                        <input
                                            type="text"
                                            value={newCompetitor.twitter}
                                            onChange={e => setNewCompetitor(prev => ({ ...prev, twitter: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                                            placeholder="@handle"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 block mb-1">Instagram</label>
                                        <input
                                            type="text"
                                            value={newCompetitor.instagram}
                                            onChange={e => setNewCompetitor(prev => ({ ...prev, instagram: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                                            placeholder="@handle"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 block mb-1">LinkedIn</label>
                                        <input
                                            type="text"
                                            value={newCompetitor.linkedin}
                                            onChange={e => setNewCompetitor(prev => ({ ...prev, linkedin: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                                            placeholder="company-slug"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-6">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddCompetitor}
                                    disabled={!newCompetitor.name.trim()}
                                    className="flex-1 bg-primary"
                                >
                                    Add Competitor
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
