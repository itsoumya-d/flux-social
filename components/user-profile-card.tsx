'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    MessageSquare,
    TrendingUp,
    AlertCircle,
    Tag,
    StickyNote,
    Plus,
    Loader2,
    BrainCircuit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContactProfile, InternalNote } from '@/app/actions/crm';

interface UserProfileCardProps {
    profile: ContactProfile | null;
    notes: InternalNote[];
    onAddNote: (content: string) => Promise<void>;
    onUpdateTags: (tags: string[]) => Promise<void>;
    onGenerateDNA: () => Promise<void>;
    userDNA: any | null;
    isGeneratingDNA: boolean;
}

export function UserProfileCard({
    profile,
    notes,
    onAddNote,
    onUpdateTags,
    onGenerateDNA,
    userDNA,
    isGeneratingDNA
}: UserProfileCardProps) {
    const [noteContent, setNoteContent] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [newTag, setNewTag] = useState('');

    if (!profile) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2">
                <User className="h-8 w-8" />
                <p className="text-xs">Select a user to view profile</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden bg-white/5 border-l border-glass-border">
            {/* Header */}
            <div className="p-6 border-b border-glass-border">
                <div className="flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 mb-3 ring-2 ring-white/10">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>{profile.name?.[0] || profile.handle[1]}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-lg">{profile.name || profile.handle}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{profile.handle}</p>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn(
                            "text-[10px]",
                            profile.sentiment_score >= 60 ? "bg-emerald-500/10 text-emerald-400" :
                                profile.sentiment_score < 40 ? "bg-rose-500/10 text-rose-400" : "bg-zinc-500/10 text-zinc-400"
                        )}>
                            Sentiment: {profile.sentiment_score}%
                        </Badge>
                        {profile.is_influencer && (
                            <Badge className="bg-purple-500/20 text-purple-400 text-[10px] border-none">Influencer</Badge>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-6">
                    <div className="p-3 bg-white/5 rounded-xl border border-glass-border text-center">
                        <div className="text-[10px] uppercase text-muted-foreground font-bold">Interactions</div>
                        <div className="text-lg font-mono font-bold">{profile.interaction_count}</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-glass-border text-center">
                        <div className="text-[10px] uppercase text-muted-foreground font-bold">Last Seen</div>
                        <div className="text-xs font-mono mt-1 text-white">
                            {profile.last_interaction_at ? new Date(profile.last_interaction_at).toLocaleDateString() : 'N/A'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* User DNA Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BrainCircuit className="h-4 w-4 text-indigo-400" />
                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">User DNA</span>
                        </div>
                        {!userDNA && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onGenerateDNA}
                                disabled={isGeneratingDNA}
                                className="h-6 text-[10px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
                            >
                                {isGeneratingDNA ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Analyze'}
                            </Button>
                        )}
                    </div>

                    {userDNA ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 space-y-3"
                        >
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Persona</span>
                                <p className="text-sm font-medium text-indigo-200">{userDNA.persona}</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Communication Style</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    <Badge variant="secondary" className="text-[10px]">{userDNA.communicationStyle}</Badge>
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Pain Points</span>
                                <ul className="list-disc list-inside text-[11px] text-muted-foreground mt-1">
                                    {userDNA.painPoints?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                </ul>
                            </div>
                            <div className="bg-indigo-500/10 p-2 rounded-lg mt-2">
                                <span className="text-[9px] text-indigo-400 uppercase font-bold block mb-1">Recommended Approach</span>
                                <p className="text-[11px] italic text-indigo-200/80 leading-relaxed">&quot;{userDNA.recommendedApproach}&quot;</p>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
                            <p className="text-[10px] text-muted-foreground">Generate DNA analysis for insights</p>
                        </div>
                    )}
                </div>

                {/* Team Notes */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <StickyNote className="h-4 w-4 text-amber-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Team Notes</span>
                    </div>

                    <div className="space-y-2">
                        {notes.map(note => (
                            <div key={note.id} className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg">
                                <p className="text-xs text-amber-100/80">{note.content}</p>
                                <div className="mt-2 flex justify-between text-[9px] text-amber-500/50">
                                    <span>Team Member</span>
                                    <span>{new Date(note.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="Add an internal note..."
                                className="w-full bg-black/20 border border-glass-border rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-500/50"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setIsAddingNote(true);
                                        onAddNote(noteContent).then(() => {
                                            setNoteContent('');
                                            setIsAddingNote(false);
                                        });
                                    }
                                }}
                            />
                        </div>
                        <Button
                            size="icon"
                            className="h-8 w-8 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400"
                            disabled={!noteContent.trim() || isAddingNote}
                            onClick={() => {
                                setIsAddingNote(true);
                                onAddNote(noteContent).then(() => {
                                    setNoteContent('');
                                    setIsAddingNote(false);
                                });
                            }}
                        >
                            {isAddingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-white/40" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white/40">Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {profile.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="bg-white/5 hover:bg-white/10 cursor-pointer">
                                {tag}
                            </Badge>
                        ))}
                        <input
                            type="text"
                            placeholder="+ Add tag"
                            className="bg-transparent border-none text-[10px] w-16 focus:w-24 transition-all outline-none text-muted-foreground focus:text-white"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = e.currentTarget.value;
                                    if (val) {
                                        onUpdateTags([...profile.tags, val]);
                                        e.currentTarget.value = '';
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
