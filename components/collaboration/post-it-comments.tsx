'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    X,
    Check,
    CornerDownRight,
    MoreVertical,
    User,
    Plus,
    Pin
} from 'lucide-react';
import { PostComment, addPostComment, resolveComment } from '@/app/actions/collaboration';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface PostItCommentsProps {
    postId: string;
    mediaIndex: number;
    comments: PostComment[];
    onCommentAdded?: (comment: PostComment) => void;
}

export function PostItComments({ postId, mediaIndex, comments, onCommentAdded }: PostItCommentsProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState<{ x: number, y: number } | null>(null);
    const [newComment, setNewComment] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredComments = comments.filter(c => c.position?.media_index === mediaIndex && !c.parent_id);
    const threads = comments.filter(c => c.parent_id);

    const handleContainerClick = (e: React.MouseEvent) => {
        if (!containerRef.current || isAdding || selectedId) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        setIsAdding({ x, y });
    };

    const handleAddComment = async (parentId?: string) => {
        if (!newComment.trim()) return;

        try {
            const comment = await addPostComment({
                postId,
                content: newComment,
                parentId,
                position: isAdding ? { ...isAdding, media_index: mediaIndex } : undefined
            });

            onCommentAdded?.(comment);
            setNewComment('');
            setIsAdding(null);
            if (!parentId) setSelectedId(comment.id);
            toast.success('Comment added');
        } catch (error) {
            toast.error('Failed to add comment');
        }
    };

    return (
        <div
            ref={containerRef}
            onClick={handleContainerClick}
            className="absolute inset-0 z-10 cursor-crosshair group"
        >
            {/* Pins */}
            {filteredComments.map((comment) => (
                <div
                    key={comment.id}
                    className="absolute z-20"
                    style={{
                        left: `${(comment.position?.x || 0) * 100}%`,
                        top: `${(comment.position?.y || 0) * 100}%`
                    }}
                >
                    <motion.button
                        layoutId={`pin-${comment.id}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(selectedId === comment.id ? null : comment.id);
                        }}
                        className={cn(
                            "w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-all",
                            comment.is_resolved ? "bg-emerald-500" : "bg-primary",
                            selectedId === comment.id && "scale-125 ring-4 ring-white/20"
                        )}
                    >
                        <Pin className="w-3 h-3 text-white fill-white" />
                    </motion.button>

                    <AnimatePresence>
                        {selectedId === comment.id && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-8 left-1/2 -translate-x-1/2 w-64 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden glass z-50"
                            >
                                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-5 w-5">
                                            <AvatarImage src={comment.user?.avatar_url} />
                                            <AvatarFallback><User className="w-3 h-3" /></AvatarFallback>
                                        </Avatar>
                                        <span className="text-[10px] font-bold text-white/70">{comment.user?.full_name}</span>
                                    </div>
                                    <button onClick={() => setSelectedId(null)}><X className="w-3 h-3 text-muted-foreground hover:text-white" /></button>
                                </div>

                                <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
                                    <p className="text-xs text-white leading-relaxed">{comment.content}</p>

                                    {/* Thread replies */}
                                    {threads.filter(t => t.parent_id === comment.id).map(reply => (
                                        <div key={reply.id} className="flex gap-3 pt-2 border-t border-white/5">
                                            <CornerDownRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-bold text-white/50">{reply.user?.full_name}</span>
                                                <p className="text-[11px] text-white/80">{reply.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-3 bg-white/5 border-t border-white/5">
                                    <div className="flex gap-2">
                                        <input
                                            placeholder="Reply..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(comment.id)}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] outline-none"
                                        />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleAddComment(comment.id)}
                                            className="h-8 px-2"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full h-7 mt-3 text-[9px] uppercase font-bold tracking-widest border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                                        onClick={async () => {
                                            await resolveComment(comment.id);
                                            setSelectedId(null);
                                            toast.success('Thread resolved');
                                        }}
                                    >
                                        <Check className="w-3 h-3 mr-1.5" /> Resolve Thread
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}

            {/* Adding New Pin */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute z-30 pointer-events-none"
                        style={{ left: `${isAdding.x * 100}%`, top: `${isAdding.y * 100}%` }}
                    >
                        <div className="w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-xl flex items-center justify-center animate-pulse">
                            <Plus className="w-4 h-4 text-white" />
                        </div>

                        <div
                            className="absolute top-10 left-1/2 -translate-x-1/2 w-64 bg-zinc-900 border border-primary/20 rounded-xl shadow-2xl p-4 glass pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Add Contextual Feedback</h4>
                            <textarea
                                placeholder="What needs to change here?"
                                value={newComment}
                                autoFocus
                                onChange={(e) => setNewComment(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs outline-none focus:border-primary/40 min-h-[80px]"
                            />
                            <div className="flex justify-end gap-2 mt-3">
                                <Button variant="ghost" size="sm" className="h-8 text-[10px]" onClick={() => setIsAdding(null)}>Cancel</Button>
                                <Button size="sm" className="h-8 text-[10px] bg-primary" onClick={() => handleAddComment()}>Post Feedback</Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty State / Instruction */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-none">
                <Pin className="w-3 h-3 text-primary" />
                <span className="text-[9px] font-bold text-white uppercase tracking-wider">Click anywhere to pin feedback</span>
            </div>
        </div>
    );
}
