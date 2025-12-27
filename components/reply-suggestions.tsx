"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, MessageSquarePlus } from "lucide-react";
import { generateAIResponse } from "@/app/actions/messages";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReplySuggestionsProps {
    messageContent: string;
    onSelect: (reply: string) => void;
    className?: string;
}

export function ReplySuggestions({ messageContent, onSelect, className }: ReplySuggestionsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const generateSuggestions = async () => {
        setIsLoading(true);
        setIsOpen(true);
        try {
            // In a real app, we'd ask for N variants.
            // For now, we'll fetch one robust one and maybe client-side variations or multiple calls.
            // Let's simplified: We call it once for a "Best Match".
            const result = await generateAIResponse(messageContent);

            if (result.success) {
                // Mocking variants for UI demo if API returns single string
                // Ideally backend returns array.
                const mainReply = result.reply;
                setSuggestions([
                    mainReply,
                    "Thanks for reaching out! We'll look into this immediately.",
                    "Appreciate the feedback. Let us know if you have more questions."
                ]);
            }
        } catch (error) {
            toast.error("Failed to generate replies");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("space-y-3", className)}>
            {!isOpen ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSuggestions}
                    className="gap-2 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/10"
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate AI Replies
                </Button>
            ) : (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-3 w-3 text-indigo-400" />
                            AI Suggestions
                        </span>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setIsOpen(false)}>Close</Button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyzing intent...
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {suggestions.map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => onSelect(suggestion)}
                                    className="text-left p-3 rounded-lg bg-white/5 border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-sm group"
                                >
                                    <div className="line-clamp-2">{suggestion}</div>
                                    <div className="flex items-center gap-1 text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 mt-1">
                                        <MessageSquarePlus className="h-3 w-3" />
                                        Use this reply
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
