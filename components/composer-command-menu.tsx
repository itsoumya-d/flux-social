"use client";

import { useEffect, useState } from "react";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
    CommandInput
} from "@/components/ui/command";
import { Sparkles, Type, Expand, Scissors, Wand2, Brain, Bot } from "lucide-react";

interface CommandMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (action: string) => void;
    position: { top: number; left: number } | null;
}

export function ComposerCommandMenu({ isOpen, onClose, onSelect, position }: CommandMenuProps) {
    if (!isOpen || !position) return null;

    return (
        <div
            className="absolute z-50 w-64 rounded-xl border border-glass-border bg-black/80 backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-100"
            style={{
                top: position.top + 24,
                left: position.left
            }}
        >
            <Command className="bg-transparent border-none">
                {/* Hidden input to capture focus if needed, but we usually want to just type */}
                {/* <CommandInput placeholder="AI Actions..." autoFocus /> */}

                <CommandList className="max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
                    <CommandGroup heading="AI Writing Assistant">
                        <CommandItem onSelect={() => onSelect('fix')} className="gap-2 cursor-pointer aria-selected:bg-indigo-500/20">
                            <Wand2 className="h-4 w-4 text-indigo-400" />
                            <span>Fix Grammar & Spelling</span>
                        </CommandItem>
                        <CommandItem onSelect={() => onSelect('tone_pro')} className="gap-2 cursor-pointer aria-selected:bg-indigo-500/20">
                            <Type className="h-4 w-4 text-blue-400" />
                            <span>Make Professional</span>
                        </CommandItem>
                        <CommandItem onSelect={() => onSelect('tone_casual')} className="gap-2 cursor-pointer aria-selected:bg-indigo-500/20">
                            <Type className="h-4 w-4 text-pink-400" />
                            <span>Make Casual & Fun</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandGroup heading="Brand Intelligence">
                        <CommandItem onSelect={() => onSelect('apply_voice')} className="gap-2 cursor-pointer aria-selected:bg-indigo-500/20">
                            <Brain className="h-4 w-4 text-purple-400" />
                            <span>Apply Brand Voice (RAG)</span>
                        </CommandItem>
                        <CommandItem onSelect={() => onSelect('learn_voice')} className="gap-2 cursor-pointer aria-selected:bg-indigo-500/20">
                            <Bot className="h-4 w-4 text-cyan-400" />
                            <span>Re-learn Brand Voice</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandGroup heading="Redrafting">
                        <CommandItem onSelect={() => onSelect('expand')} className="gap-2 cursor-pointer aria-selected:bg-indigo-500/20">
                            <Expand className="h-4 w-4 text-emerald-400" />
                            <span>Expand & Elaborate</span>
                        </CommandItem>
                        <CommandItem onSelect={() => onSelect('shorten')} className="gap-2 cursor-pointer aria-selected:bg-indigo-500/20">
                            <Scissors className="h-4 w-4 text-amber-400" />
                            <span>Shorten (TL;DR)</span>
                        </CommandItem>
                        <CommandItem onSelect={() => onSelect('emojify')} className="gap-2 cursor-pointer aria-selected:bg-indigo-500/20">
                            <Sparkles className="h-4 w-4 text-yellow-400" />
                            <span>Add Emojis</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
        </div>
    );
}
