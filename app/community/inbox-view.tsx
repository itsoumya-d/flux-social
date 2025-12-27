'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    MessageSquare,
    Sparkles,
    Filter,
    CheckCircle2,
    Clock,
    Trash2,
    Reply,
    Twitter,
    Instagram,
    Linkedin,
    Star,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Eye,
    Loader2,
    Radio,
    ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { sendMessage, generateAIResponse, markAsRead, markAsImportant, deleteMessage, getMentions } from '@/app/actions/messages';
import { checkCrisisAlerts } from '@/app/actions/social-listening';
import { FeedItem, getUnifiedFeed } from '@/app/actions/unified-feed';
import { ReplySuggestions } from '@/components/reply-suggestions';
import { PricingModal } from '@/components/pricing-modal';
import { checkSubscription } from '@/lib/subscription';
import { useUser } from '@clerk/nextjs';

// Platform icons
const platformIcons: Record<string, any> = {
    twitter: Twitter,
    linkedin: Linkedin,
    instagram: Instagram,
};

const platformColors: Record<string, string> = {
    twitter: 'text-sky-400',
    linkedin: 'text-blue-500',
    instagram: 'text-rose-400',
};

const sentimentColors: Record<string, string> = {
    positive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    negative: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    neutral: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const sentimentIcons: Record<string, any> = {
    positive: TrendingUp,
    negative: AlertCircle,
    neutral: MessageSquare,
};

export default function InboxView({
    initialFeedItems,
    brandId,
    brandVoice
}: {
    initialFeedItems: FeedItem[],
    brandId?: string,
    brandVoice?: string
}) {
    // Basic state
    const [feedItems, setFeedItems] = useState<FeedItem[]>(initialFeedItems);
    const [selectedId, setSelectedId] = useState<string | null>(initialFeedItems[0]?.id || null);
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);

    // CRM state
    const [currentProfile, setCurrentProfile] = useState<ContactProfile | null>(null);
    const [currentNotes, setCurrentNotes] = useState<InternalNote[]>([]);
    const [userDNA, setUserDNA] = useState<any | null>(null);
    const [isGeneratingDNA, setIsGeneratingDNA] = useState(false);

    // AI state
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [platformFilter, setPlatformFilter] = useState<string | null>(null);
    const [sentimentFilter, setSentimentFilter] = useState<string | null>(null);
    const [sortByPriority, setSortByPriority] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Social Listening state
    const [showMentions, setShowMentions] = useState(false);
    const [mentions, setMentions] = useState<any[]>([]);
    const [isLoadingMentions, setIsLoadingMentions] = useState(false);
    const [crisisStatus, setCrisisStatus] = useState<{ isCrisis: boolean; themes: any[] }>({ isCrisis: false, themes: [] });

    // Subscription
    const { user: clerkUser } = useUser();
    const [isPro, setIsPro] = useState(false);
    const [showPricing, setShowPricing] = useState(false);

    useEffect(() => {
        if (clerkUser?.id) {
            checkSubscription(clerkUser.id).then(status => setIsPro(status.isPro));
        }
    }, [clerkUser?.id]);

    // Team state
    const [teamMembers, setTeamMembers] = useState<TeamMemberWithProfile[]>([]);
    const [assignedToMeFilter, setAssignedToMeFilter] = useState(false);

    // Derived state
    const selectedItem = useMemo(() =>
        feedItems.find(m => m.id === selectedId) || null
        , [feedItems, selectedId]);

    // Filter feed items
    const filteredFeedItems = useMemo(() => {
        const result = feedItems.filter(item => {
            const matchesSearch = !searchQuery ||
                item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sender_name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPlatform = !platformFilter || item.platform === platformFilter;
            const matchesSentiment = !sentimentFilter || item.sentiment === sentimentFilter;
            // For prototype, assume 'user_1' is current user
            const matchesAssignment = !assignedToMeFilter || item.assigned_to === 'user_1';

            return matchesSearch && matchesPlatform && matchesSentiment && matchesAssignment;
        });

        if (sortByPriority) {
            result.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
        }

        return result;
    }, [feedItems, searchQuery, platformFilter, sentimentFilter, sortByPriority, assignedToMeFilter]);

    const [isLoading, setIsLoading] = useState(false);

    // Initial Data Fetch (Crisis & Team)
    useEffect(() => {
        if (brandId) {
            checkCrisisAlerts(brandId).then(status => {
                setCrisisStatus({ isCrisis: status.isCrisis, themes: status.themes });
            });
            getTeamMembers(brandId).then(setTeamMembers);
        }
    }, [brandId]);

    // Unified Feed Fetching
    useEffect(() => {
        if (!brandId) return;

        const fetchFeed = async () => {
            setIsLoading(true);
            try {
                const results = await getUnifiedFeed(brandId, {
                    platform: platformFilter || undefined,
                    sentiment: sentimentFilter || undefined,
                    // We'll filter the resolved state locally for smoother UI in this prototype
                });
                setFeedItems(results);

                // Select first item if none selected
                if (results.length > 0 && !selectedId) {
                    setSelectedId(results[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch unified feed:', error);
                toast.error('Failed to update feed');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeed();
    }, [brandId, platformFilter, sentimentFilter]);

    const handleAssignMessage = async (userId: string | null) => {
        if (!selectedItem) return;
        const updated = await assignMessage(selectedItem.id, userId);
        // Optimistic update
        setFeedItems(prev => prev.map(m => m.id === selectedItem.id ? { ...m, assigned_to: userId } : m));
        toast.success(userId ? 'Conversation assigned' : 'Assignment removed');
    };

    // Fetch CRM Data when selected item changes
    useEffect(() => {
        if (brandId && selectedItem) {
            // 1. Fetch/Create Profile
            getContactProfile(brandId, selectedItem.platform, selectedItem.sender_handle)
                .then(async (result) => {
                    if (result.profile) {
                        setCurrentProfile(result.profile);
                        // 2. Fetch Notes
                        const notes = await getInternalNotes(result.profile.id);
                        setCurrentNotes(notes);
                        // 3. Reset DNA (will generate on demand)
                        setUserDNA(null);
                    } else {
                        // Create temporary profile object for UI if not in DB yet
                        setCurrentProfile({
                            id: 'temp',
                            brand_id: brandId,
                            platform: selectedItem.platform,
                            handle: selectedItem.sender_handle,
                            name: selectedItem.sender_name,
                            avatar_url: selectedItem.sender_avatar,
                            tags: [],
                            sentiment_score: 50,
                            interaction_count: 1,
                            last_interaction_at: selectedItem.created_at,
                            is_influencer: false,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        });
                        setCurrentNotes([]);
                        setUserDNA(null);
                    }
                });
        }
    }, [selectedId, brandId, selectedItem]);

    // Stats
    const stats = useMemo(() => ({
        total: feedItems.length,
        unread: feedItems.filter(m => !m.is_read).length,
        important: feedItems.filter(m => m.is_important).length,
        negative: feedItems.filter(m => m.sentiment === 'negative').length,
    }), [feedItems]);

    // Handlers
    const generateSuggestion = async (content: string) => {
        setIsGenerating(true);
        try {
            const result = await generateAIResponse(content, brandVoice);
            setAiSuggestion(result.reply);
        } catch (error) {
            console.error('AI generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !brandId || !selectedItem) return;

        setIsSending(true);
        try {
            // In a real app, 'sendMessage' would check type (private vs public reply)
            const newMessage = await sendMessage(brandId, replyText, selectedItem.platform);

            // Normalize the new message into a FeedItem for the UI
            const newFeedItem: FeedItem = {
                id: newMessage.id,
                type: "message",
                platform: newMessage.platform,
                content: newMessage.content,
                sender_name: "You",
                sender_handle: "@brand",
                sender_avatar: "", // Add default avatar if needed
                created_at: newMessage.created_at,
                sentiment: "neutral",
                priority_score: 0,
                is_read: true,
                is_important: false,
                is_resolved: true,
                raw_data: newMessage,
            };

            setFeedItems([newFeedItem, ...feedItems]);
            setReplyText('');
            toast.success('Reply sent!');
        } catch (error) {
            toast.error('Failed to send reply');
        } finally {
            setIsSending(false);
        }
    };

    const handleMarkAsRead = async (itemId: string) => {
        const item = feedItems.find(i => i.id === itemId);
        if (!item || item.type !== 'message') {
            // Mentions don't have 'mark as read' in the same way (they have 'resolved')
            setFeedItems(prev => prev.map(m => m.id === itemId ? { ...m, is_read: true, is_resolved: true } : m));
            return;
        }
        try {
            await markAsRead(itemId);
            setFeedItems(prev => prev.map(m => m.id === itemId ? { ...m, is_read: true, is_resolved: true } : m));
        } catch {
            return; // Silent fail
        }
    };

    const handleToggleImportant = async (itemId: string, currentState: boolean) => {
        try {
            // Only update DB for messages; mentions are UI-only/local in this prototype
            const item = feedItems.find(i => i.id === itemId);
            if (item?.type === 'message') {
                await markAsImportant(itemId, !currentState);
            }
            setFeedItems(prev => prev.map(m => m.id === itemId ? { ...m, is_important: !currentState } : m));
            toast.success(currentState ? 'Removed from important' : 'Marked as important');
        } catch {
            toast.error('Failed to update');
        }
    };

    const handleDelete = async (itemId: string) => {
        try {
            const item = feedItems.find(i => i.id === itemId);
            if (item?.type === 'message') {
                await deleteMessage(itemId);
            }
            setFeedItems(prev => prev.filter(m => m.id !== itemId));
            if (selectedId === itemId && feedItems.length > 1) {
                // Select next available
                const next = feedItems.find(m => m.id !== itemId);
                setSelectedId(next?.id || null);
            } else if (feedItems.length <= 1) {
                setSelectedId(null);
            }
            toast.success('Conversation removed');
        } catch {
            toast.error('Failed to delete');
        }
    };

    // CRM Handlers
    const handleAddNote = async (content: string) => {
        if (!currentProfile || currentProfile.id === 'temp') {
            toast.error('Save contact to add notes (simulated)');
            return;
        }
        const result = await addInternalNote(currentProfile.id, content);
        if (result.note) {
            setCurrentNotes([result.note, ...currentNotes]);
            toast.success('Note added');
        } else {
            toast.error('Failed to add note');
        }
    };

    const handleUpdateTags = async (tags: string[]) => {
        if (!currentProfile || currentProfile.id === 'temp') return;
        const success = await updateContactTags(currentProfile.id, tags);
        if (success) {
            setCurrentProfile({ ...currentProfile, tags });
            toast.success('Tags updated');
        }
    };

    const handleGenerateDNA = async () => {
        if (!brandId || !selectedItem) return;
        setIsGeneratingDNA(true);
        try {
            const history = await getInteractionHistory(brandId, selectedItem.sender_handle);
            const dna = await generateUserDNASummary(history);
            if (dna) {
                setUserDNA(dna);
                toast.success('User DNA analyzed 🧬');
            }
        } catch {
            toast.error('Failed to generate analysis');
        } finally {
            setIsGeneratingDNA(false);
        }
    };

    const loadMentions = async () => {
        if (!brandId) return;
        setIsLoadingMentions(true);
        try {
            const result = await getMentions(brandId, ['FluxSocial', 'flux']);
            setMentions(result.mentions);
        } catch (error) {
            console.error('Failed to load mentions:', error);
        } finally {
            setIsLoadingMentions(false);
        }
    };

    return (
        <div className="grid h-[calc(100vh-120px)] grid-cols-1 md:grid-cols-12 gap-0 border border-glass-border rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* LEFT: Inbox List (25%) */}
            <div className="md:col-span-3 flex flex-col bg-white/5 border-r border-glass-border">
                {/* Header Stats */}
                <div className="p-4 border-b border-glass-border bg-black/20">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold uppercase tracking-widest">Smart Inbox</h2>
                        <div className="flex gap-2">
                            {crisisStatus.isCrisis ? (
                                <Badge className="bg-rose-500 text-white animate-bounce border-none px-2 shadow-[0_0_15px_rgba(244,63,94,0.5)]">CRISIS 🔥</Badge>
                            ) : stats.unread > 0 && (
                                <Badge className="bg-primary/20 text-primary border-none text-[10px]">{stats.unread} New</Badge>
                            )}
                        </div>
                    </div>

                    {/* Crisis Banner */}
                    <AnimatePresence>
                        {crisisStatus.isCrisis && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="mb-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[10px] text-rose-400"
                            >
                                <div className="font-bold flex items-center gap-1 mb-1">
                                    <AlertCircle className="h-3 w-3" /> High Negativity Detected
                                </div>
                                {crisisStatus.themes[0] && <p className="truncate">{crisisStatus.themes[0].theme}</p>}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Search */}
                    <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-glass-border rounded-lg h-8 pl-8 pr-3 text-xs outline-none focus:border-primary/50"
                        />
                    </div>

                    {/* Filter Toggles */}
                    <div className="flex justify-between gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn("text-[10px] h-6 px-1.5 gap-1", showFilters && "bg-white/10")}
                        >
                            <Filter className="h-3 w-3" /> Filters
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSortByPriority(!sortByPriority)}
                            className={cn("text-[10px] h-6 px-1.5 gap-1", sortByPriority && "bg-amber-500/20 text-amber-400")}
                        >
                            <Sparkles className="h-3 w-3" /> Smart Sort
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                // Now integrated into unified feed, this button could toggle unresolved-only or similar
                                setAssignedToMeFilter(!assignedToMeFilter);
                            }}
                            className={cn("text-[10px] h-6 px-1.5 gap-1", assignedToMeFilter && "bg-indigo-500/20 text-indigo-400")}
                        >
                            <Users className="h-3 w-3" /> My Tasks
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSortByPriority(!sortByPriority)}
                            className={cn("text-[10px] h-6 px-1.5 gap-1", sortByPriority && "bg-amber-500/20 text-amber-400")}
                        >
                            <Sparkles className="h-3 w-3" /> Smart Sort
                        </Button>
                    </div>
                </div>

                {/* Filters Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="bg-black/40 border-b border-glass-border overflow-hidden"
                        >
                            <div className="p-3 space-y-2">
                                <div className="flex gap-1 justify-center">
                                    {['twitter', 'linkedin', 'instagram'].map(platform => (
                                        <button
                                            key={platform}
                                            onClick={() => setPlatformFilter(platformFilter === platform ? null : platform)}
                                            className={cn("p-1.5 rounded transition-all", platformFilter === platform ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/10")}
                                        >
                                            {platform === 'twitter' && <Twitter className="h-3.5 w-3.5" />}
                                            {platform === 'linkedin' && <Linkedin className="h-3.5 w-3.5" />}
                                            {platform === 'instagram' && <Instagram className="h-3.5 w-3.5" />}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-1 justify-center">
                                    {['positive', 'negative'].map(sentiment => {
                                        const isGated = !isPro && sentiment !== 'neutral';
                                        return (
                                            <button
                                                key={sentiment}
                                                onClick={() => {
                                                    if (isGated) {
                                                        setShowPricing(true);
                                                        return;
                                                    }
                                                    setSentimentFilter(sentimentFilter === sentiment ? null : sentiment)
                                                }}
                                                className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-bold border relative overflow-hidden",
                                                    sentimentFilter === sentiment
                                                        ? (sentiment === 'positive' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/20 border-rose-500/30 text-rose-400')
                                                        : "border-transparent bg-white/5 text-muted-foreground"
                                                )}
                                            >
                                                <span className={cn(isGated && "blur-sm")}>{sentiment}</span>
                                                {isGated && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[8px] text-indigo-300 font-bold">PRO</div>}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {showMentions && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="bg-indigo-950/20 border-b border-indigo-500/20 overflow-hidden"
                        >
                            <div className="p-2">
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <h3 className="text-[10px] font-bold uppercase text-indigo-300">Brand Mentions ({mentions.length})</h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 hover:bg-indigo-500/20 text-indigo-300"
                                        onClick={() => setShowDashboard(true)}
                                    >
                                        <Maximize2 className="h-3 w-3" />
                                    </Button>
                                </div>
                                <div className="space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                    {isLoadingMentions ? (
                                        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-indigo-400" /></div>
                                    ) : mentions.length === 0 ? (
                                        <p className="text-[10px] text-center text-indigo-300/50 py-2">No active mentions found.</p>
                                    ) : (
                                        mentions.map((m: any, i: number) => (
                                            <div key={i} className="bg-black/20 p-2 rounded border border-indigo-500/10 hover:border-indigo-500/30 transition-colors">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-[10px] font-bold text-indigo-200">{m.author}</span>
                                                    <span className="text-[9px] text-indigo-400/60">{m.platform}</span>
                                                </div>
                                                <p className="text-[10px] text-indigo-100/80 line-clamp-2">{m.content}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Feed List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredFeedItems.map((item) => {
                        const PlatformIcon = platformIcons[item.platform] || MessageSquare;
                        const TypeIcon = item.type === 'mention' ? Radio : MessageSquare;

                        return (
                            <div
                                key={item.id}
                                onClick={() => {
                                    setSelectedId(item.id);
                                    if (!item.is_read) handleMarkAsRead(item.id);
                                    setAiSuggestion(null); // Reset AI suggestion
                                }}
                                className={cn(
                                    "p-3 rounded-lg cursor-pointer transition-all border border-transparent group relative",
                                    item.id === selectedId ? "bg-white/10 border-primary/20 shadow-sm" : "hover:bg-white/5",
                                    !item.is_read && "border-l-primary/50 border-l-2"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={item.sender_avatar} />
                                            <AvatarFallback>{item.sender_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className={cn("text-xs font-bold truncate max-w-[100px]", !item.is_read && "text-white")}>
                                            {item.sender_name}
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-muted-foreground">
                                        {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
                                    <PlatformIcon className={cn("h-2.5 w-2.5", platformColors[item.platform])} />
                                    <span className="text-[9px] text-muted-foreground/70">@{item.sender_handle.replace('@', '')}</span>
                                    <TypeIcon className="h-2 w-2 text-muted-foreground/40 ml-1" />
                                    {item.sentiment === 'negative' && <TrendingDown className="h-3 w-3 text-rose-500" />}
                                    {item.sentiment === 'positive' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                                    {item.priority_score > 80 && <Badge variant="outline" className="text-[9px] border-amber-500/50 text-amber-500 h-3.5 px-1 py-0">Urgent</Badge>}
                                </div>
                                <p className="text-[11px] line-clamp-2 text-muted-foreground/80 leading-snug px-0.5">
                                    {item.content}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MIDDLE: Conversation (50%) */}
            <div className="md:col-span-6 flex flex-col bg-white/5 backdrop-blur-sm">
                {selectedItem ? (
                    <>
                        {/* Thread Header */}
                        <div className="h-16 border-b border-glass-border flex items-center justify-between px-6 bg-black/20">
                            <div className="flex items-center gap-3">
                                {selectedItem.type === 'mention' && <Radio className="h-3 w-3 text-indigo-400" />}
                                <h3 className="font-bold text-sm">{selectedItem.sender_name}</h3>
                                {selectedItem.is_important && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                                <Badge variant="outline" className={cn("text-[9px] h-5", sentimentColors[selectedItem.sentiment])}>
                                    {selectedItem.sentiment}
                                </Badge>
                            </div>
                            <div className="flex gap-2 items-center">
                                {/* Assignment Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs border border-white/10 hover:bg-white/10">
                                            {selectedItem.assigned_to ? (
                                                <>
                                                    <Avatar className="h-4 w-4">
                                                        <AvatarImage src={teamMembers.find(m => m.user_id === selectedItem.assigned_to)?.profile.avatar_url || ''} />
                                                        <AvatarFallback className="text-[9px]">{(teamMembers.find(m => m.user_id === selectedItem.assigned_to)?.profile.full_name || '?')[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="max-w-[80px] truncate">{(teamMembers.find(m => m.user_id === selectedItem.assigned_to)?.profile.full_name || 'Unknown').split(' ')[0]}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-muted-foreground">Assign</span>
                                                </>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 bg-black/90 border-glass-border">
                                        <DropdownMenuLabel>Assign Conversation</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {teamMembers.map(member => (
                                            <DropdownMenuItem key={member.id} onClick={() => handleAssignMessage(member.user_id)} className="gap-2 cursor-pointer">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={member.profile.avatar_url || ''} />
                                                    <AvatarFallback className="text-[10px]">{(member.profile.full_name || '?')[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium">{member.profile.full_name || 'Unknown'}</span>
                                                    <span className="text-[10px] text-muted-foreground capitalize">{member.role}</span>
                                                </div>
                                                {selectedItem.assigned_to === member.user_id && <Check className="ml-auto h-3 w-3 text-emerald-400" />}
                                            </DropdownMenuItem>
                                        ))}
                                        {selectedItem.assigned_to && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleAssignMessage(null)} className="text-rose-400 cursor-pointer">
                                                    Unassign
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <div className="h-4 w-px bg-white/10 mx-1" />

                                <Button variant="ghost" size="icon" onClick={() => handleToggleImportant(selectedItem.id, selectedItem.is_important)} className="h-8 w-8 hover:bg-white/10">
                                    <Star className={cn("h-4 w-4", selectedItem.is_important ? "text-amber-400 fill-amber-400" : "text-muted-foreground")} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(selectedItem.id)} className="h-8 w-8 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Thread Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Message Bubble */}
                            <div className="flex gap-4">
                                <Avatar className="h-10 w-10 mt-1">
                                    <AvatarImage src={selectedItem.sender_avatar} />
                                </Avatar>
                                <div className="space-y-2 max-w-[85%]">
                                    <div className="bg-white/10 border border-white/5 p-4 rounded-2xl rounded-tl-none relative group">
                                        <p className="text-sm leading-relaxed text-white/90">{selectedItem.content}</p>
                                        <span className="text-[10px] text-muted-foreground absolute bottom-2 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {new Date(selectedItem.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {/* AI Insight Box */}
                                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-3 flex gap-3 items-start">
                                        <Sparkles className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-bold text-indigo-300">
                                                {selectedItem.type === 'mention' ? 'Discovery Insight' : 'AI Context Analysis'}
                                            </p>
                                            <div className="text-[11px] text-indigo-200/60 leading-snug">
                                                Item seems {selectedItem.sentiment}.
                                                {selectedItem.priority_score > 70 ? ' High priority interaction.' : ' Routine interaction.'}
                                                {selectedItem.raw_data.is_influencer && ' High-reach author detected 🌟.'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AI Reply Suggestion */}
                            <div className="ml-14 max-w-[85%]">
                                <ReplySuggestions
                                    messageContent={selectedItem.content}
                                    onSelect={(reply) => setReplyText(reply)}
                                />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-black/20 border-t border-glass-border">
                            <div className="relative bg-white/5 rounded-xl border border-glass-border focus-within:border-primary/50 transition-all p-1">
                                <textarea
                                    placeholder="Type your reply..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="w-full bg-transparent resize-none h-20 text-sm outline-none p-3"
                                />
                                <div className="flex justify-between items-center px-2 pb-2">
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-400 hover:bg-indigo-500/20" onClick={() => generateSuggestion(selectedItem.content)}>
                                            <Sparkles className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button size="sm" onClick={handleSendReply} disabled={!replyText.trim() || isSending} className="h-8 text-xs gap-2">
                                        {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Reply className="h-3 w-3" />}
                                        {selectedItem.type === 'mention' ? 'Public Reply' : 'Send'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-30">
                        <MessageSquare className="h-16 w-16 mb-4" />
                        <p>Select a conversation</p>
                    </div>
                )}
            </div>

            {/* RIGHT: Profile & CRM (25%) */}
            <div className="md:col-span-3 h-full">
                <UserProfileCard
                    profile={currentProfile}
                    notes={currentNotes}
                    onAddNote={handleAddNote}
                    onUpdateTags={handleUpdateTags}
                    onGenerateDNA={handleGenerateDNA}
                    userDNA={userDNA}
                    isGeneratingDNA={isGeneratingDNA}
                />
            </div>

            <Dialog open={showDashboard} onOpenChange={setShowDashboard}>
                <DialogContent className="max-w-5xl h-[85vh] p-0 border-glass-border bg-black/90 backdrop-blur-xl">
                    <SocialListeningDashboard brandId={brandId} />
                </DialogContent>
            </Dialog>
            <PricingModal open={showPricing} onOpenChange={setShowPricing} />
        </div>
    );
}

// Add imports for CRM features
import { getContactProfile, getInternalNotes, addInternalNote, updateContactTags, generateUserDNASummary, getInteractionHistory, ContactProfile, InternalNote } from '@/app/actions/crm';
import { getTeamMembers, assignMessage, TeamMemberWithProfile } from '@/app/actions/team';
import { UserProfileCard } from '@/components/user-profile-card';
import { SocialListeningDashboard } from '@/components/social-listening-dashboard';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Maximize2, UserPlus, Users, Check } from 'lucide-react';
