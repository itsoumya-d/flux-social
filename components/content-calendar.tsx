'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    Image,
    MoreHorizontal,
    Sparkles,
    GripVertical,
    Twitter,
    Instagram,
    Linkedin,
    Facebook,
    Check,
    X,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { toast } from 'sonner';
import { getPosts, updatePost, approvePost, rejectPost, deletePost } from '@/app/actions/posts';
import { Loader2 } from 'lucide-react';

// Mock scheduled posts
// Removed mockPosts

const platformIcons: Record<string, any> = {
    twitter: Twitter,
    instagram: Instagram,
    linkedin: Linkedin,
    facebook: Facebook,
};

const platformColors: Record<string, string> = {
    twitter: '#1DA1F2',
    instagram: '#E1306C',
    linkedin: '#0A66C2',
    facebook: '#1877F2',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface ContentCalendarProps {
    brandId?: string;
}

export function ContentCalendar({ brandId }: ContentCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [view, setView] = useState<'month' | 'week'>('month');
    const [viewMode, setViewMode] = useState<'calendar' | 'approvals'>('calendar');
    const [draggedPost, setDraggedPost] = useState<string | null>(null);

    const loadPosts = useCallback(async () => {
        if (!brandId) return;
        setLoading(true);
        try {
            const data = await getPosts(brandId);
            setPosts(data.map((p: any) => ({
                ...p,
                scheduledAt: p.scheduled_at ? new Date(p.scheduled_at) : null
            })));
        } catch (error) {
            toast.error('Failed to load posts');
        } finally {
            setLoading(false);
        }
    }, [brandId]);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    // Get calendar days for current month
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startOffset = firstDay.getDay();

        const days: Date[] = [];

        // Add days from previous month
        for (let i = startOffset - 1; i >= 0; i--) {
            days.push(new Date(year, month, -i));
        }

        // Add days from current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        // Add days from next month to complete grid
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push(new Date(year, month + 1, i));
        }

        return days;
    }, [currentDate]);

    // Get posts for a specific date
    const getPostsForDate = useCallback((date: Date) => {
        return posts.filter(post => {
            const postDate = new Date(post.scheduledAt);
            return (
                postDate.getDate() === date.getDate() &&
                postDate.getMonth() === date.getMonth() &&
                postDate.getFullYear() === date.getFullYear() &&
                post.status !== 'pending_review' // Hide pending from calendar view
            );
        });
    }, [posts]);

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
            return newDate;
        });
    };

    const handleDragEnd = async (postId: string, targetDate: Date) => {
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        const originalTime = new Date(post.scheduledAt);
        const newDate = new Date(targetDate);
        newDate.setHours(originalTime.getHours(), originalTime.getMinutes());

        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return { ...p, scheduledAt: newDate };
            }
            return p;
        }));

        try {
            await updatePost(postId, {
                content: post.content,
                platforms: post.platforms,
                scheduledAt: newDate.toISOString(),
                mediaUrls: post.media_urls,
                requiresReview: post.requires_review
            });
            toast.success('Post rescheduled!');
        } catch (error) {
            toast.error('Failed to reschedule post');
            loadPosts(); // Revert
        }
        setDraggedPost(null);
    };

    const handleApproval = async (postId: string, approved: boolean) => {
        try {
            if (approved) {
                await approvePost(postId);
                toast.success('Post approved and scheduled! ✅');
            } else {
                await rejectPost(postId);
                toast.success('Post rejected 📝');
            }
            loadPosts();
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentDate.getMonth();
    };

    const pendingPosts = posts.filter(p => p.status === 'pending_review');

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                        Content Calendar
                    </h2>

                    {/* View Mode Toggle */}
                    <div className="flex gap-1 p-1 bg-white/5 rounded-lg border border-white/10 w-full sm:w-auto">
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${viewMode === 'calendar'
                                ? 'bg-blue-500/20 text-blue-400 shadow-sm'
                                : 'text-muted-foreground hover:text-white'
                                }`}
                        >
                            Calendar
                        </button>
                        <button
                            onClick={() => setViewMode('approvals')}
                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 ${viewMode === 'approvals'
                                ? 'bg-amber-500/20 text-amber-400 shadow-sm'
                                : 'text-muted-foreground hover:text-white'
                                }`}
                        >
                            Approvals
                            {pendingPosts.length > 0 && (
                                <span className="bg-amber-500 text-black text-[9px] sm:text-[10px] font-bold px-1.5 rounded-full h-3.5 sm:h-4 flex items-center justify-center">
                                    {pendingPosts.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {viewMode === 'calendar' && (
                        <div className="hidden sm:flex gap-1 p-1 bg-white/5 rounded-lg ml-0 sm:ml-4">
                            <button
                                onClick={() => setView('month')}
                                className={`px-3 py-1 rounded text-sm ${view === 'month' ? 'bg-white/10' : 'text-gray-400'}`}
                            >
                                Month
                            </button>
                            <button
                                onClick={() => setView('week')}
                                className={`px-3 py-1 rounded text-sm ${view === 'week' ? 'bg-white/10' : 'text-gray-400'}`}
                            >
                                Week
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-4 w-full md:w-auto">
                    {viewMode === 'calendar' && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => navigateMonth('prev')}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-xs sm:text-sm font-semibold min-w-[100px] sm:min-w-[160px] text-center">
                                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => navigateMonth('next')}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    <Button size="sm" className="gap-2 bg-primary text-xs sm:text-sm h-8 sm:h-10 flex-1 sm:flex-none">
                        <Plus className="w-4 h-4" />
                        <span className="hidden xs:inline">Schedule Post</span>
                        <span className="xs:hidden">Schedule</span>
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[500px] bg-white/5 border border-white/10 rounded-xl">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground animate-pulse">Syncing your social schedule...</p>
                </div>
            ) : viewMode === 'calendar' ? (
                /* Calendar Grid */
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 border-b border-white/10">
                        {DAYS.map(day => (
                            <div key={day} className="py-3 text-center text-sm font-semibold text-gray-400">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7">
                        {calendarDays.map((date, i) => {
                            const dayPosts = getPostsForDate(date);
                            const isDropTarget = draggedPost !== null;

                            return (
                                <div
                                    key={i}
                                    className={`
                      min-h-[80px] sm:min-h-[120px] border-b border-r border-white/5 p-1 sm:p-2 cursor-pointer
                      transition-colors hover:bg-white/5
                      ${!isCurrentMonth(date) ? 'opacity-40' : ''}
                      ${isToday(date) ? 'bg-primary/5' : ''}
                      ${isDropTarget ? 'hover:bg-blue-500/10' : ''}
                    `}
                                >
                                    <div className={`
                      text-[10px] sm:text-sm font-medium mb-1 sm:mb-2
                      ${isToday(date) ? 'text-primary' : 'text-gray-400'}
                    `}>
                                        {date.getDate()}
                                        {isToday(date) && (
                                            <span className="ml-1 text-[8px] sm:text-[10px] text-primary hidden sm:inline">Today</span>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <AnimatePresence>
                                            {dayPosts.slice(0, 3).map((post: any) => (
                                                <motion.div
                                                    key={post.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    draggable
                                                    onDragStart={() => setDraggedPost(post.id)}
                                                    onDragEnd={() => setDraggedPost(null)}
                                                    className={`
                               group relative p-1 sm:p-2 rounded sm:rounded-lg text-[9px] sm:text-xs cursor-grab active:cursor-grabbing
                               ${post.status === 'draft' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5 border border-white/10'}
                               hover:bg-white/10 transition-colors
                             `}
                                                >
                                                    <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                                                        <GripVertical className="hidden sm:block w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        {post.platforms.slice(0, 2).map((p: string) => {
                                                            const Icon = platformIcons[p];
                                                            return Icon ? (
                                                                <Icon
                                                                    key={p}
                                                                    className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                                                                    style={{ color: platformColors[p] }}
                                                                />
                                                            ) : null;
                                                        })}
                                                        <span className="ml-auto text-[8px] sm:text-[10px] text-gray-500 hidden xs:block">
                                                            {new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="line-clamp-1 sm:line-clamp-2 text-gray-300">
                                                        {post.content}
                                                    </p>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                        {dayPosts.length > 3 && (
                                            <div className="text-[8px] sm:text-[10px] text-gray-400 text-center py-0.5 sm:py-1">
                                                +{dayPosts.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* Approvals List View */
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
                    <div className="p-6 border-b border-white/10">
                        <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Pending Approval ({pendingPosts.length})
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">Review and approve posts scheduled by your team.</p>
                    </div>

                    <div className="divide-y divide-white/10">
                        {pendingPosts.length === 0 ? (
                            <div className="p-12 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in zoom-in duration-500">
                                <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-500/50" />
                                <p>All caught up! No posts waiting for review.</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {pendingPosts.map(post => (
                                    <motion.div
                                        key={post.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
                                        className="p-6 hover:bg-white/5 transition-colors group relative bg-transparent"
                                    >
                                        <div className="flex items-start justify-between gap-6">
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded text-xs text-muted-foreground">
                                                        <span className="font-bold text-white">{post.creator?.full_name || 'Teammate'}</span> requested approval
                                                    </div>
                                                    <div className="w-px h-3 bg-white/10" />
                                                    <div className="flex items-center gap-1.5">
                                                        {post.platforms.map((p: string) => {
                                                            const Icon = platformIcons[p];
                                                            return Icon ? <Icon key={p} className="w-3.5 h-3.5" style={{ color: platformColors[p] }} /> : null;
                                                        })}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        Scheduled for {new Date(post.scheduledAt).toLocaleDateString()} at {new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                <div className="bg-black/40 border border-white/5 p-4 rounded-xl max-w-2xl">
                                                    <p className="text-sm leading-relaxed">{post.content}</p>
                                                    {post.media && (
                                                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
                                                            <Image className="w-3 h-3" /> Attached Media
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApproval(post.id, true)}
                                                    className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20"
                                                >
                                                    <Check className="w-4 h-4 mr-2" /> Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleApproval(post.id, false)}
                                                    className="border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                                                >
                                                    <X className="w-4 h-4 mr-2" /> Reject
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            )
            }

            {/* AI Suggestion (Only in Calendar Mode) */}
            {
                viewMode === 'calendar' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-xl p-5"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-xl bg-purple-500/20">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-purple-300 mb-1">AI Scheduling Insight</h3>
                                <p className="text-sm text-gray-400">
                                    You have <span className="text-white font-medium">3 posts scheduled</span> for next week,
                                    but your optimal posting frequency is <span className="text-white font-medium">5 posts per week</span>.
                                    Consider adding content on Wednesday and Friday for better reach.
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <Button size="sm" className="h-8 text-xs bg-purple-500/20 text-purple-300 hover:bg-purple-500/30">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Generate Posts
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 text-xs text-gray-400">
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )
            }

            {/* Legend (Only in Calendar Mode) */}
            {
                viewMode === 'calendar' && (
                    <div className="flex items-center gap-6 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-white/10 border border-white/20" />
                            <span>Scheduled</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" />
                            <span>Draft</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" />
                            <span>Published</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30" />
                            <span>Failed</span>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
