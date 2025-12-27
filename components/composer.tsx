'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Monitor,
    Wand2,
    Image as ImageIcon,
    Smile,
    Calendar,
    Twitter,
    Instagram,
    Linkedin,
    Send,
    Sparkles,
    Link as LinkIcon,
    Hash,
    MessageSquare,
    ArrowUpRight,
    TrendingUp,
    BarChart3,
    Clock,
    Trash2,
    CheckCircle2,
    Loader2,
    Zap,
    Target,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useChannel, usePresence, usePresenceListener } from 'ably/react';
import { useUser } from '@clerk/nextjs';
import { createPost, updatePost } from '@/app/actions/posts';
import { getComments, deleteComment, resolveComment } from '@/app/actions/comments';
import {
    polishContent,
    generateCaption,
    generateHashtags,
    predictPerformance,
    predictROI,
    learnBrandVoice,
    generateNanoBananaImage,
    smartAdaptContent
} from '@/app/actions/ai';
import { getBrandVoice } from '@/app/actions/brand-voice';
import { toast } from 'sonner';
import { MediaSelector } from './media-selector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { getUserRole } from '@/app/actions/profiles';
import { Slider } from './ui/slider';
import { PricingModal } from './pricing-modal';
import { checkSubscription } from '@/lib/subscription';
import { ComposerCommandMenu } from './composer-command-menu';
import { checkAndPerformAutoTopup } from '@/app/actions/billing';
import { SimulationModal } from './composer/simulation-modal';
import { PostItComments } from './collaboration/post-it-comments';
import { getPostComments } from '@/app/actions/collaboration';

// Custom icon components for platforms without lucide icons
const TikTokIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);

const PinterestIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0a12 12 0 0 0-4.373 23.178c-.07-.63-.134-1.595.027-2.282l1.157-4.902s-.296-.593-.296-1.469c0-1.377.798-2.404 1.792-2.404.845 0 1.253.635 1.253 1.395 0 .85-.542 2.121-.82 3.3-.233.985.495 1.788 1.467 1.788 1.761 0 3.113-1.857 3.113-4.535 0-2.372-1.704-4.03-4.137-4.03-2.818 0-4.472 2.114-4.472 4.301 0 .852.328 1.765.738 2.262.081.098.093.184.069.284-.075.313-.244.985-.278 1.122-.043.182-.143.222-.332.134-1.24-.578-2.014-2.391-2.014-3.849 0-3.131 2.276-6.007 6.561-6.007 3.446 0 6.124 2.455 6.124 5.735 0 3.423-2.158 6.177-5.153 6.177-1.006 0-1.953-.523-2.277-1.142l-.619 2.361c-.224.863-.829 1.945-1.234 2.605A12 12 0 1 0 12 0z" />
    </svg>
);

const platforms = [
    { id: 'twitter', icon: Twitter, color: 'text-[#1DA1F2]', label: 'X/Twitter' },
    { id: 'instagram', icon: Instagram, color: 'text-[#E1306C]', label: 'Instagram' },
    { id: 'linkedin', icon: Linkedin, color: 'text-[#0077B5]', label: 'LinkedIn' },
    { id: 'tiktok', icon: TikTokIcon, color: 'text-[#000000] dark:text-white', label: 'TikTok' },
    { id: 'youtube', icon: YoutubeIcon, color: 'text-[#FF0000]', label: 'YouTube' },
    { id: 'pinterest', icon: PinterestIcon, color: 'text-[#E60023]', label: 'Pinterest' },
];

export default function Composer({ brandId, initialPost }: { brandId?: string; initialPost?: any }) {
    const { user: clerkUser } = useUser();
    const [contents, setContents] = useState<Record<string, string>>(
        initialPost?.platform_overrides || { default: initialPost?.content || '' }
    );
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(initialPost?.platforms || ['twitter']);
    const [activeTab, setActiveTab] = useState(initialPost?.platforms?.[0] || 'twitter');
    const [isGlobalSync, setIsGlobalSync] = useState(!initialPost?.platform_overrides);
    const [overriddenPlatforms, setOverriddenPlatforms] = useState<string[]>(
        initialPost?.platform_overrides ? Object.keys(initialPost.platform_overrides) : []
    );
    const [selectedMedia, setSelectedMedia] = useState<string[]>(initialPost?.media_urls || []);
    const [isMediaOpen, setIsMediaOpen] = useState(false);
    const [isPolishing, setIsPolishing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPredicting, setIsPredicting] = useState(false);
    const [needsReview, setNeedsReview] = useState(initialPost?.requires_review || false);
    const [suggestedTime, setSuggestedTime] = useState<string | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [prediction, setPrediction] = useState<any>(null);
    // NEW: First Comment Scheduling (Buffer feature - critical for Instagram engagement)
    const [firstComment, setFirstComment] = useState(initialPost?.first_comment || '');
    // NEW: Recurring Posts (Buffer doesn't have this - competitive advantage)
    const [isRecurring, setIsRecurring] = useState(initialPost?.is_recurring || false);
    const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [userRole, setUserRole] = useState<string>('viewer');
    const [isLearningVoice, setIsLearningVoice] = useState(false);
    const [brandVoiceProfile, setBrandVoiceProfile] = useState<string | null>(null);
    const [useGeminiForGen, setUseGeminiForGen] = useState(true);
    const [isAdapting, setIsAdapting] = useState(false);

    // Slash Command State
    const [commandMenuOpen, setCommandMenuOpen] = useState(false);
    const [commandMenuPos, setCommandMenuPos] = useState<{ top: number, left: number } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ROI Prediction State
    const [roiResult, setRoiResult] = useState<any>(null);
    const [isRoiCalculating, setIsRoiCalculating] = useState(false);
    const [targetCPA, setTargetCPA] = useState(15);
    const [avgOrderValue, setAvgOrderValue] = useState(50);
    const [isThreadMode, setIsThreadMode] = useState(false);

    const [activeUsers, setActiveUsers] = useState<any[]>([]);
    const [isSimulationOpen, setIsSimulationOpen] = useState(false);

    useEffect(() => {
        if (brandId) {
            getUserRole(brandId).then(setUserRole);
            getBrandVoice(brandId).then(voice => {
                if (voice) {
                    // Extract a summary of the voice for the composer
                    setBrandVoiceProfile(`Tone: ${voice.tone_formality > 0.6 ? 'Formal' : 'Casual'}, 
                    Enthusiasm: ${voice.tone_enthusiasm > 0.6 ? 'High' : 'Measured'}, 
                    Humor: ${voice.tone_humor > 0.5 ? 'Witty' : 'Professional'}`);
                }
            });
        }
    }, [brandId]);

    // Subscription State
    const [isPro, setIsPro] = useState(false);
    const [showPricing, setShowPricing] = useState(false);

    useEffect(() => {
        if (clerkUser?.id) {
            checkSubscription(clerkUser.id).then(status => setIsPro(status.isPro));
        }
    }, [clerkUser?.id]);

    const [channel, setChannel] = useState<any>(null);

    useEffect(() => {
        if (initialPost?.id) {
            getComments(initialPost.id).then(setComments);
        }
    }, [initialPost?.id]);

    const handleContentChange = (newContent: string) => {
        // AI Slash Command Trigger
        if (newContent.endsWith('/')) {
            // Calculate cursor position for menu
            // This is a simplified approximation; for production we'd use a dedicated library like 'textarea-caret'
            // For now, we center it or place it near the bottom
            if (textareaRef.current) {
                const { selectionStart } = textareaRef.current;
                // Dummy positioning near cursor - hard to get exact pixels without extra libs
                // We will position it relative to the container for now
                setCommandMenuPos({ top: 100, left: 50 });
                setCommandMenuOpen(true);
            }
        } else if (commandMenuOpen && !newContent.includes('/')) {
            setCommandMenuOpen(false);
        }

        if (isGlobalSync) {
            setContents({ default: newContent });
        } else {
            setContents(prev => ({
                ...prev,
                [activeTab]: newContent
            }));
            if (!overriddenPlatforms.includes(activeTab)) {
                setOverriddenPlatforms(prev => [...prev, activeTab]);
            }
        }

        if (channel) {
            channel.publish('content-update', {
                content: newContent,
                isGlobal: isGlobalSync,
                platform: activeTab
            });
        }
    };

    const handleCommandSelect = async (action: string) => {
        setCommandMenuOpen(false);

        // Feature Gating
        if (!isPro) {
            setShowPricing(true);
            return;
        }

        const textWithoutSlash = currentContent.slice(0, -1); // Remove the trigger slash

        setIsPolishing(true);
        try {
            // Re-using polishContent action but with specific intent
            let improvements: string[] = [];
            if (action === 'fix') improvements = ['grammar', 'spelling'];
            if (action === 'tone_pro') improvements = ['professional tone'];
            if (action === 'tone_casual') improvements = ['casual tone', 'humor'];
            if (action === 'expand') improvements = ['expand', 'detail'];
            if (action === 'shorten') improvements = ['conciseness', 'summary'];
            if (action === 'emojify') improvements = ['emojis'];
            if (action === 'apply_voice') improvements = ['tone', 'clarity'];

            if (action === 'learn_voice' && brandId) {
                setIsLearningVoice(true);
                const learnRes = await learnBrandVoice(brandId);
                if (learnRes.success) {
                    setBrandVoiceProfile(learnRes.brandVoiceProfile || null);
                    toast.success('Brand voice profile updated! 🧠');
                    return;
                }
                toast.error('Voice learning failed');
                return;
            }

            const result = await polishContent({
                content: textWithoutSlash,
                platform: activeTab,
                improvements: improvements as any,
                brandId: brandId
            });

            if (result.success) {
                handleContentChange(result.polished);
                toast.success('AI magic applied! ✨');
            } else {
                toast.error('AI command failed');
            }
        } catch (error) {
            toast.error('AI command failed');
        } finally {
            setIsPolishing(false);
        }
    };

    const currentContent = isGlobalSync ? (contents.default || '') : (contents[activeTab] || contents.default || '');

    useEffect(() => {
        if (currentContent.length > 20) {
            const date = new Date();
            date.setHours(date.getHours() + 6);
            setSuggestedTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

            // Debounced Prediction & ROI
            const timer = setTimeout(async () => {
                setIsPredicting(true);
                setIsRoiCalculating(true);
                try {
                    const [perfResult, roiRes] = await Promise.all([
                        predictPerformance({
                            content: currentContent,
                            platform: activeTab
                        }),
                        predictROI({
                            content: currentContent,
                            platform: activeTab,
                            targetCPA,
                            avgOrderValue
                        })
                    ]);

                    if (perfResult.success && perfResult.prediction) {
                        setPrediction(perfResult.prediction);

                        // Proactive Billing Check (Task 7.3)
                        const score = (perfResult.prediction as any).engagementScore || 0;
                        if (score >= 85 && isPro) {
                            const topupRes = await checkAndPerformAutoTopup(initialPost?.id || 'draft', score);
                            if (topupRes.success && (topupRes as any).topupPerformed) {
                                toast.success(`Performance Secured! +${(topupRes as any).amount} credits added for this high-impact candidate. 🛡️`, {
                                    description: `AI detected high viral potential (${score}%).`,
                                    duration: 6000
                                });
                            }
                        }
                    }
                    if (roiRes.success) setRoiResult(roiRes.roi);
                } catch (error) {
                    console.error('Predictions failed:', error);
                } finally {
                    setIsPredicting(false);
                    setIsRoiCalculating(false);
                }
            }, 1500);

            return () => clearTimeout(timer);
        } else {
            setSuggestedTime(null);
            setPrediction(null);
            setRoiResult(null);
        }
    }, [currentContent, activeTab, targetCPA, avgOrderValue]);

    const handleSchedule = async () => {
        const primaryContent = contents.default || contents[selectedPlatforms[0]] || '';
        if (!primaryContent && !isGlobalSync) {
            toast.error('Content cannot be empty');
            return;
        }

        const isEditor = userRole === 'editor';
        const finalStatus = (needsReview || isEditor) ? 'pending_review' : (initialPost?.scheduled_at ? 'scheduled' : 'draft');

        try {
            if (initialPost?.id) {
                await updatePost(initialPost.id, {
                    content: primaryContent,
                    platforms: selectedPlatforms,
                    scheduledAt: initialPost.scheduled_at || new Date(Date.now() + 86400000).toISOString(),
                    requiresReview: needsReview || isEditor,
                    platformOverrides: isGlobalSync ? undefined : contents,
                    mediaUrls: selectedMedia
                });
                toast.success((needsReview || isEditor) ? 'Post updated and submitted for review!' : 'Post updated successfully!');
            } else {
                await createPost({
                    brandId: brandId || 'bba8f8f8-b8b8-4b8b-b8b8-b8b8b8b8b8b8',
                    content: primaryContent,
                    platforms: selectedPlatforms,
                    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
                    requiresReview: needsReview || isEditor,
                    firstComment: selectedPlatforms.includes('instagram') ? firstComment : undefined,
                    recurringConfig: isRecurring ? {
                        enabled: true,
                        frequency: recurringFrequency,
                        maxOccurrences: 12
                    } : undefined,
                    platformOverrides: isGlobalSync ? undefined : contents,
                    mediaUrls: selectedMedia
                });
                const successMsg = isRecurring
                    ? `Recurring post scheduled (${recurringFrequency})! 🔄`
                    : ((needsReview || isEditor) ? 'Post submitted for review!' : 'Post scheduled successfully!');
                toast.success(successMsg);
            }
        } catch (error) {
            toast.error('Failed to process post');
        }
    };

    const togglePlatform = (id: string) => {
        setSelectedPlatforms(prev => {
            const newSelection = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
            if (newSelection.length > 0 && !newSelection.includes(activeTab)) {
                setActiveTab(newSelection[0]);
            }
            return newSelection;
        });
    };

    const charCount = currentContent.length;
    const maxCharsMap: Record<string, number> = {
        twitter: 280,
        linkedin: 3000,
        instagram: 2200,
        tiktok: 2200,
        youtube: 5000,
        pinterest: 500
    };

    const handleSmartAdapt = async () => {
        setIsAdapting(true);
        try {
            const result = await smartAdaptContent({
                content: currentContent,
                platforms: selectedPlatforms.filter(p => !overriddenPlatforms.includes(p))
            });

            if (result.success && result.adaptations) {
                setContents(prev => ({
                    ...prev,
                    ...result.adaptations
                }));
                // Add adapted platforms to overridden list so they don't auto-sync back
                setOverriddenPlatforms(prev => Array.from(new Set([...prev, ...Object.keys(result.adaptations)])));
                toast.success('Content adapted for all selected platforms! 🚀');
            } else {
                toast.error('Adaptation failed');
            }
        } catch (error) {
            console.error('Adaptation failed:', error);
            toast.error('Failed to adapt content');
        } finally {
            setIsAdapting(false);
        }
    };

    return (
        <div className="grid h-[calc(100vh-120px)] grid-cols-1 gap-8 md:col-span-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {process.env.NEXT_PUBLIC_ABLY_API_KEY && (
                <ComposerRealtime
                    clerkUser={clerkUser}
                    setContents={setContents}
                    isGlobalSync={isGlobalSync}
                    activeTab={activeTab}
                    setActiveUsers={setActiveUsers}
                    setChannel={setChannel}
                />
            )}
            {/* LEFT: Editor Panel (60%) */}
            <div className="flex flex-col md:col-span-3 space-y-6">
                <div className="premium-card flex-1 flex flex-col p-8 bg-white/5">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Craft your message</h2>
                                <p className="text-muted-foreground text-sm">Select platforms and compose your content.</p>
                            </div>
                            <div className="h-8 w-px bg-glass-border hidden lg:block" />
                            <div className="flex -space-x-2">
                                {activeUsers.map((user: any, i: number) => (
                                    <div
                                        key={user.id || i}
                                        className={cn("h-8 w-8 rounded-full border-2 border-background overflow-hidden relative group bg-indigo-500")}
                                        title={user.name}
                                    >
                                        <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                                        <div className="absolute inset-0 ring-2 ring-emerald-500/50 rounded-full animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex bg-muted/30 p-1 rounded-xl border border-glass-border">
                            {platforms.map((platform) => {
                                const isSelected = selectedPlatforms.includes(platform.id);
                                return (
                                    <button
                                        key={platform.id}
                                        onClick={() => togglePlatform(platform.id)}
                                        className={cn(
                                            "p-2.5 rounded-lg transition-all duration-200",
                                            isSelected
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                                                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                        )}
                                    >
                                        <platform.icon className="h-5 w-5" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between p-2 rounded-lg bg-white/5 border border-glass-border">
                        <div className="flex items-center gap-3">
                            <Monitor className="h-4 w-4 text-indigo-400" />
                            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground/50">Customize for {activeTab}</span>
                        </div>
                        <button
                            onClick={() => {
                                if (isGlobalSync) {
                                    setContents(prev => ({
                                        ...prev,
                                        [activeTab]: prev.default || ''
                                    }));
                                    if (!overriddenPlatforms.includes(activeTab)) {
                                        setOverriddenPlatforms(prev => [...prev, activeTab]);
                                    }
                                    setIsGlobalSync(false);
                                } else {
                                    setIsGlobalSync(true);
                                }
                            }}
                            className={cn(
                                "w-10 h-5 rounded-full transition-all relative border border-white/10",
                                !isGlobalSync ? "bg-indigo-500" : "bg-zinc-800"
                            )}
                        >
                            <div className={cn(
                                "absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                                !isGlobalSync ? "left-6" : "left-1"
                            )} />
                        </button>

                        <div className="h-4 w-px bg-glass-border mx-2" />

                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isAdapting || isGlobalSync || selectedPlatforms.length < 2}
                            onClick={handleSmartAdapt}
                            className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-2 h-7 px-3"
                        >
                            {isAdapting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                            Smart Adapt All
                        </Button>
                    </div>

                    <div className="relative flex-1 group">
                        <Textarea
                            value={currentContent}
                            onChange={(e) => handleContentChange(e.target.value)}
                            placeholder="Type your content here... Use / for AI actions or # for hashtags."
                            className="h-full min-h-[300px] resize-none border-none bg-transparent p-0 text-xl leading-relaxed focus-visible:ring-0 placeholder:text-muted-foreground/30"
                        />
                        <ComposerCommandMenu
                            isOpen={commandMenuOpen}
                            onClose={() => setCommandMenuOpen(false)}
                            onSelect={handleCommandSelect}
                            position={commandMenuPos}
                        />
                        <div className="absolute bottom-0 right-0 py-2 px-4 rounded-full bg-muted/20 text-[10px] font-mono text-muted-foreground uppercase tracking-wider backdrop-blur-sm border border-glass-border">
                            {currentContent.length} / {selectedPlatforms.length > 0 ? maxCharsMap[activeTab] || 280 : '---'}
                        </div>
                    </div>

                    {/* NEW: First Comment Scheduling (Buffer feature - critical for Instagram engagement) */}
                    {selectedPlatforms.includes('instagram') && (
                        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent border border-pink-500/20">
                            <div className="flex items-center gap-2 mb-2">
                                <Instagram className="h-4 w-4 text-pink-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-pink-400">First Comment</span>
                                <span className="text-[10px] text-muted-foreground">(Boost engagement with hashtags)</span>
                            </div>
                            <Textarea
                                value={firstComment}
                                onChange={(e) => setFirstComment(e.target.value)}
                                placeholder="Add your hashtags and engagement prompt as the first comment..."
                                className="min-h-[60px] resize-none border-pink-500/20 bg-black/20 text-sm focus-visible:ring-pink-500/50"
                            />
                        </div>
                    )}

                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-glass-border">
                        <div className="flex gap-3">
                            <Dialog open={isMediaOpen} onOpenChange={setIsMediaOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="premium-button bg-white/5 hover:bg-white/10">
                                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl p-0 bg-transparent border-none overflow-hidden h-[600px]">
                                    <DialogTitle className="sr-only">Media Command Center</DialogTitle>
                                    <MediaSelector
                                        brandId={brandId || 'default'}
                                        onSelect={(urls) => {
                                            setSelectedMedia(urls);
                                            setIsMediaOpen(false);
                                        }}
                                    />
                                </DialogContent>
                            </Dialog>
                            <Button variant="ghost" size="icon" className="premium-button bg-white/5 hover:bg-white/10">
                                <Smile className="h-5 w-5 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="premium-button bg-white/5 hover:bg-white/10" onClick={() => handleContentChange(currentContent + ' #')}>
                                <Hash className="h-5 w-5 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="premium-button bg-white/5 hover:bg-white/10">
                                <LinkIcon className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-6">
                            {suggestedTime && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Best Time:</span>
                                    <span className="text-[10px] font-bold text-indigo-400">{suggestedTime}</span>
                                </div>
                            )}

                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div
                                    onClick={() => setNeedsReview(!needsReview)}
                                    className={cn(
                                        "w-8 h-4 rounded-full transition-all relative border border-white/10",
                                        needsReview ? "bg-primary" : "bg-zinc-800"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all shadow-sm",
                                        needsReview ? "left-4.5" : "left-0.5"
                                    )} />
                                </div>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground group-hover:text-foreground transition-colors">Requires Review</span>
                            </label>

                            {/* NEW: Recurring Posts Toggle (Buffer doesn't have this!) */}
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div
                                        onClick={() => setIsRecurring(!isRecurring)}
                                        className={cn(
                                            "w-8 h-4 rounded-full transition-all relative border border-white/10",
                                            isRecurring ? "bg-emerald-500" : "bg-zinc-800"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all shadow-sm",
                                            isRecurring ? "left-4.5" : "left-0.5"
                                        )} />
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground group-hover:text-foreground transition-colors">Recurring</span>
                                </label>
                                {isRecurring && (
                                    <select
                                        value={recurringFrequency}
                                        onChange={(e) => setRecurringFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                                        className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-2 py-1 text-[10px] font-bold text-emerald-400 uppercase outline-none"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                )}
                            </div>

                            {activeTab === 'twitter' && (
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div
                                            onClick={() => {
                                                setIsThreadMode(!isThreadMode);
                                                if (!isThreadMode && !aiTopic) {
                                                    setAiTopic(currentContent);
                                                }
                                            }}
                                            className={cn(
                                                "w-8 h-4 rounded-full transition-all relative border border-white/10",
                                                isThreadMode ? "bg-sky-500" : "bg-zinc-800"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all shadow-sm",
                                                isThreadMode ? "left-4.5" : "left-0.5"
                                            )} />
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground group-hover:text-foreground transition-colors">Thread Mode</span>
                                    </label>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAIPanel(!showAIPanel)}
                                    className="premium-button gap-2 border-indigo-500/20 hover:bg-indigo-500/10 text-indigo-400"
                                >
                                    <Zap className="h-4 w-4" />
                                    AI Tools
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (!currentContent.trim()) {
                                            toast.error('Add content to simulate');
                                            return;
                                        }
                                        setIsSimulationOpen(true);
                                    }}
                                    className="premium-button gap-2 border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400"
                                >
                                    <TrendingUp className="h-4 w-4" />
                                    Simulate
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={async () => {
                                        if (!currentContent.trim()) {
                                            toast.error('Add some content first');
                                            return;
                                        }
                                        setIsPolishing(true);
                                        try {
                                            const result = await polishContent({
                                                content: currentContent,
                                                platform: activeTab,
                                                improvements: ['clarity', 'engagement', 'conciseness'],
                                                brandId: brandId
                                            });
                                            if (result.success) {
                                                handleContentChange(result.polished);
                                                toast.success('Content polished with AI! ✨');
                                            } else {
                                                toast.error(result.error || 'Polish failed');
                                            }
                                        } catch (error) {
                                            toast.error('AI polish failed');
                                        } finally {
                                            setIsPolishing(false);
                                        }
                                    }}
                                    disabled={isPolishing || !currentContent.trim()}
                                    className="premium-button gap-2 border-primary/20 hover:bg-primary/5 text-primary relative overflow-hidden"
                                >
                                    {isPolishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    {isPolishing ? 'Polishing...' : 'AI Polish'}
                                </Button>
                                <Button
                                    onClick={handleSchedule}
                                    className="premium-button gap-2 shadow-xl shadow-primary/20 px-8"
                                >
                                    {userRole === 'editor' ? (
                                        <><Send className="h-4 w-4" /> Send for Approval</>
                                    ) : (
                                        <><Calendar className="h-4 w-4" /> {initialPost ? 'Update' : 'Schedule'}</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {selectedMedia.length > 0 && (
                        <div className="mt-6 grid grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                            {selectedMedia.map((url, i) => (
                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group shadow-2xl">
                                    <img src={url} className="h-full w-full object-cover" alt="" />
                                    <button
                                        onClick={() => setSelectedMedia(prev => prev.filter(u => u !== url))}
                                        className="absolute top-1 right-1 h-6 w-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                                    >
                                        <X className="h-3 w-3 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <SimulationModal
                        isOpen={isSimulationOpen}
                        onOpenChange={setIsSimulationOpen}
                        content={currentContent}
                        platform={activeTab}
                    />
                </div>
            </div>

            {/* RIGHT: Preview Panel (40%) */}
            <div className="flex flex-col md:col-span-2 space-y-6">
                <div className="premium-card flex-1 p-6 bg-gradient-to-br from-primary/5 to-transparent">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Live Preview</h3>
                            <TabsList className="bg-muted/30 p-1 rounded-xl border border-glass-border">
                                {selectedPlatforms.map(p => (
                                    <TabsTrigger
                                        key={p}
                                        value={p}
                                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm relative"
                                    >
                                        <div className="flex items-center gap-2">
                                            {p === 'twitter' && <Twitter className="h-3.5 w-3.5" />}
                                            {p === 'instagram' && <Instagram className="h-3.5 w-3.5" />}
                                            {p === 'linkedin' && <Linkedin className="h-3.5 w-3.5" />}
                                            <span className="capitalize text-[10px] font-bold">{p}</span>
                                            {overriddenPlatforms.includes(p) && !isGlobalSync && (
                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full border border-background" />
                                            )}
                                        </div>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="flex justify-center flex-1 py-4"
                            >
                                {activeTab === 'twitter' && (
                                    <div className="w-full max-w-[340px] premium-card bg-black p-4 border-none shadow-2xl">
                                        <div className="flex gap-3">
                                            <Avatar className="h-10 w-10 border border-white/10">
                                                <AvatarImage src={clerkUser?.imageUrl || "https://github.com/shadcn.png"} />
                                                <AvatarFallback>CN</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-1 group/user">
                                                    <span className="text-sm font-bold text-white group-hover/user:underline">{clerkUser?.fullName || 'Flux User'}</span>
                                                    <span className="text-sm text-zinc-500">@flux · 1m</span>
                                                </div>
                                                <div className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-100">
                                                    {currentContent || <span className="text-zinc-600">What's happening?</span>}
                                                </div>
                                                {selectedMedia.length > 0 && (
                                                    <div className={cn(
                                                        "mt-3 grid gap-2 rounded-2xl overflow-hidden border border-zinc-800 relative group/media",
                                                        selectedMedia.length === 1 ? "grid-cols-1" : "grid-cols-2"
                                                    )}>
                                                        {selectedMedia.map((url, i) => (
                                                            <div key={i} className="relative aspect-square">
                                                                <img src={url} className="w-full h-full object-cover" alt="" />
                                                                <PostItComments
                                                                    postId={initialPost?.id || 'temp'}
                                                                    mediaIndex={i}
                                                                    comments={comments}
                                                                    onCommentAdded={(c) => setComments([...comments, c])}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="mt-4 flex justify-between text-zinc-500 max-w-[240px]">
                                                    <MessageSquare className="h-4 w-4" />
                                                    <TrendingUp className="h-4 w-4" />
                                                    <BarChart3 className="h-4 w-4" />
                                                    <Send className="h-4 w-4 rotate-[-45deg]" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'instagram' && (
                                    <div className="w-full max-w-[320px] premium-card bg-white text-black overflow-hidden border-none shadow-2xl">
                                        <div className="p-3 flex items-center gap-2 border-b border-zinc-100">
                                            <Avatar className="h-8 w-8 ring-1 ring-zinc-200">
                                                <AvatarImage src={clerkUser?.imageUrl || "https://github.com/shadcn.png"} />
                                                <AvatarFallback>CN</AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs font-bold">flux.social</span>
                                        </div>
                                        <div className="aspect-square bg-zinc-50 relative overflow-hidden flex items-center justify-center border-y border-zinc-100 group/media">
                                            {selectedMedia.length > 0 ? (
                                                <>
                                                    <img src={selectedMedia[0]} className="h-full w-full object-cover" alt="" />
                                                    <PostItComments
                                                        postId={initialPost?.id || 'temp'}
                                                        mediaIndex={0}
                                                        comments={comments}
                                                        onCommentAdded={(c) => setComments([...comments, c])}
                                                    />
                                                </>
                                            ) : (
                                                <div className="w-full h-full bg-zinc-50 flex items-center justify-center">
                                                    <ImageIcon className="h-10 w-10 text-zinc-200" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 space-y-2">
                                            <div className="flex gap-4">
                                                <Smile className="h-5 w-5" />
                                                <MessageSquare className="h-5 w-5" />
                                                <Send className="h-5 w-5" />
                                            </div>
                                            <div className="text-xs">
                                                <span className="font-bold mr-2">flux.social</span>
                                                <span className="text-zinc-700 whitespace-pre-wrap">{currentContent || "Write a caption..."}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'linkedin' && (
                                    <div className="w-full max-w-[340px] premium-card bg-white text-black p-4 border-none shadow-2xl">
                                        <div className="flex gap-2 mb-3">
                                            <Avatar className="h-12 w-12 rounded-lg">
                                                <AvatarImage src={clerkUser?.imageUrl || "https://github.com/shadcn.png"} />
                                                <AvatarFallback>CN</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="text-[13px] font-bold">{clerkUser?.fullName || 'Flux User'} @ Flux Social</div>
                                                <div className="text-[11px] text-zinc-500">Social Intelligence & Strategy</div>
                                                <div className="text-[11px] text-zinc-400 flex items-center gap-1">1m • <Monitor className="h-2 w-2" /></div>
                                            </div>
                                        </div>
                                        <div className="text-[13px] leading-relaxed mb-4 text-zinc-800 whitespace-pre-wrap">
                                            {currentContent || "What do you want to talk about?"}
                                        </div>
                                        {selectedMedia.length > 0 && (
                                            <div className="mb-4 rounded-xl overflow-hidden border border-zinc-200 relative group/media">
                                                <img src={selectedMedia[0]} className="w-full h-auto" alt="" />
                                                <PostItComments
                                                    postId={initialPost?.id || 'temp'}
                                                    mediaIndex={0}
                                                    comments={comments}
                                                    onCommentAdded={(c) => setComments([...comments, c])}
                                                />
                                            </div>
                                        )}
                                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 flex items-center gap-3">
                                            <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                <LinkIcon className="h-5 w-5 text-indigo-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] font-bold truncate">Flux.social | The Premium Choice</div>
                                                <div className="text-[10px] text-zinc-500 truncate">flux.social/pro-demo</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </Tabs>
                </div>

                <div className="premium-card p-4 flex items-center justify-between text-xs text-muted-foreground group hover:text-foreground transition-colors cursor-help">
                    <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <span>Responsive desktop preview enabled</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>

                {/* Dynamic Performance & ROI Prediction Panel */}
                <div className="premium-card p-6 space-y-6 relative overflow-hidden group">
                    <AnimatePresence>
                        {(isPredicting || isRoiCalculating) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-[4px] z-10 flex items-center justify-center"
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative">
                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                                        <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Calculating Economic Impact...</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Viral Potential Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <BarChart3 className="h-3 w-3" />
                                Viral Trajectory
                            </h3>
                            {prediction?.engagementScore && (
                                <Badge variant="outline" className={cn(
                                    "text-[9px] border-none px-2 py-0.5 font-bold tracking-tighter",
                                    prediction.engagementScore > 75 ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                                )}>
                                    {prediction.viralPotential?.toUpperCase() || 'MODERATE'} VELOCITY
                                </Badge>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="text-muted-foreground/60 uppercase">Engagement Prob.</span>
                                <span className="text-indigo-400 font-mono">{prediction?.engagementScore || 0}%</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-indigo-500 via-primary to-emerald-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${prediction?.engagementScore || 0}%` }}
                                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-glass-border" />

                    {/* ROI Prediction Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                                <TrendingUp className="h-3 w-3" />
                                Predicted ROI
                            </h3>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/5">
                                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="glass max-w-sm">
                                    <DialogHeader>
                                        <DialogTitle className="text-sm font-bold uppercase tracking-widest">Business Assumptions</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-6 pt-4">
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span>Target CPA</span>
                                                <span className="text-emerald-400">${targetCPA}</span>
                                            </div>
                                            <Slider
                                                value={[targetCPA]}
                                                onValueChange={([v]: number[]) => setTargetCPA(v)}
                                                max={200}
                                                step={1}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span>Avg Order Value</span>
                                                <span className="text-indigo-400">${avgOrderValue}</span>
                                            </div>
                                            <Slider
                                                value={[avgOrderValue]}
                                                onValueChange={([v]: number[]) => setAvgOrderValue(v)}
                                                max={1000}
                                                step={5}
                                            />
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col gap-1.5"
                            >
                                <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">Est. Revenue</span>
                                <span className="text-lg font-bold text-white tracking-tighter">
                                    {roiResult?.predictedRevenue || '$0.00'}
                                </span>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col gap-1.5"
                            >
                                <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">ROI Yield</span>
                                <span className="text-lg font-bold text-indigo-400 tracking-tighter">
                                    +{roiResult?.roiPercentage || 0}%
                                </span>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* AI Tools Panel */}
                <AnimatePresence>
                    {showAIPanel && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="premium-card p-6 space-y-4 border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent overflow-hidden"
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-indigo-400" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400">AI Content Studio</h3>
                            </div>

                            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Target className="h-4 w-4 text-indigo-400" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Adaptive Brand Voice</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    {brandVoiceProfile || "Learn your brand's unique tone from historical posts."}
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        setIsLearningVoice(true);
                                        try {
                                            const result = await learnBrandVoice(brandId || 'default');
                                            if (result.success) {
                                                setBrandVoiceProfile(result.brandVoiceProfile!);
                                                toast.success('Brand voice learned! 🧠');
                                            }
                                        } finally {
                                            setIsLearningVoice(false);
                                        }
                                    }}
                                    disabled={isLearningVoice}
                                    className="w-full text-[10px] h-8 border-indigo-500/20 hover:bg-indigo-500/20"
                                >
                                    {isLearningVoice ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Zap className="h-3 w-3 mr-2" />}
                                    {isLearningVoice ? 'Analyzing...' : 'Compute Brand Voice'}
                                </Button>
                            </div>

                            <div className="flex gap-2 flex-wrap pb-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        if (!currentContent.trim()) return;
                                        try {
                                            const result = await generateHashtags({ content: currentContent, platform: activeTab });
                                            if (result.success) {
                                                handleContentChange(currentContent + '\n\n' + result.hashtags.join(' '));
                                                toast.success('Hashtags added!');
                                            }
                                        } catch { }
                                    }}
                                    className="text-[10px] h-8"
                                    disabled={!currentContent.trim()}
                                >
                                    <Hash className="h-3 w-3" /> Add Hashtags
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        if (!currentContent.trim()) return;
                                        setIsGenerating(true);
                                        try {
                                            const result = await generateNanoBananaImage({
                                                prompt: currentContent.slice(0, 100),
                                                platform: activeTab,
                                                quality: '4K'
                                            });
                                            if (result.success && result.imageUrl) {
                                                setSelectedMedia(prev => [...prev, result.imageUrl]);
                                                toast.success('NanoBanana Pro Image Generated! 🍌');
                                            }
                                        } finally {
                                            setIsGenerating(false);
                                        }
                                    }}
                                    className="text-[10px] h-8 border-amber-500/20 text-amber-500"
                                    disabled={!currentContent.trim() || isGenerating}
                                >
                                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                                    NanoBanana Pro (4K)
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Team Feedback */}
                {comments.length > 0 && (
                    <div className="premium-card p-6 space-y-4 border-amber-500/20 bg-amber-500/5">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-amber-400" />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">Team Feedback</h3>
                        </div>
                        <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 group/comment">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={comment.profile?.avatar_url} />
                                        <AvatarFallback>{comment.profile?.full_name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold">{comment.profile?.full_name}</span>
                                            <span className="text-[10px] text-muted-foreground">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className={cn(
                                            "text-[11px] text-zinc-300 italic",
                                            comment.is_resolved && "line-through text-zinc-500"
                                        )}>
                                            "{comment.content}"
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}

function ComposerRealtime({ clerkUser, setContents, isGlobalSync, activeTab, setActiveUsers, setChannel }: any) {
    const { channel } = useChannel('composer', (message: any) => {
        if (message.name === 'content-update' && message.clientId !== clerkUser?.id) {
            setContents({ default: message.data.content }); // Simple fix for now
        }
    });

    useEffect(() => {
        if (channel) {
            setChannel(channel);
        }
    }, [channel, setChannel]);

    usePresence('composer', {
        name: clerkUser?.fullName || 'Anonymous Fluxer',
        image: clerkUser?.imageUrl,
    });

    const { presenceData } = usePresenceListener('composer');

    useEffect(() => {
        if (presenceData) {
            const users = (presenceData || []).map((p: any) => ({
                id: p.clientId,
                name: p.data?.name || 'Anonymous Fluxer',
                image: p.data?.image || `https://i.pravatar.cc/150?u=${p.clientId}`,
                color: 'bg-indigo-500'
            }));
            setActiveUsers(users);
        }
    }, [presenceData, setActiveUsers]);

    return null;
}
