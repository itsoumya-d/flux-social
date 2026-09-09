'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Wand2, ArrowRight } from 'lucide-react';
import type { Persona } from './onboarding-wizard';

interface MagicDraftProps {
    persona: Persona;
    onDraftGenerated: (content: string) => void;
}

export function MagicDraft({ persona, onDraftGenerated }: MagicDraftProps) {
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [typedContent, setTypedContent] = useState('');
    const [fullContent, setFullContent] = useState('');

    // Hardcoded demo generation to ensure "Magic" happens even without API keys initially
    const generateDemo = () => {
        setIsGenerating(true);
        // Simulate API delay
        setTimeout(() => {
            let content = "";
            if (persona === 'casual') {
                content = `Just launched something new! 🚀\n\nReally excited about the progress we're making. It's been a wild ride but totally worth it. Can't wait to share more soon! ✨ #buildinginpublic #startup`;
            } else if (persona === 'professional') {
                content = `We are pleased to announce a significant milestone in our roadmap.\n\nOur team has been dedicated to enhancing user value, and today's update reflects that commitment. Thank you for your continued partnership. 📈 #Innovation #BusinessGrowth`;
            } else {
                content = `This changes EVERYTHING. 🤯\n\nMost people ignore this one simple rule of growth.\n\nHere's how we 10x'd our output in 2 days (Thread 🧵)\n\n👇`;
            }
            setFullContent(content);
        }, 1500);
    };

    // Typewriter effect
    useEffect(() => {
        if (fullContent && typedContent.length < fullContent.length) {
            const timeout = setTimeout(() => {
                setTypedContent(fullContent.slice(0, typedContent.length + 1));
            }, 30);
            return () => clearTimeout(timeout);
        }
    }, [fullContent, typedContent]);

    return (
        <div className="text-center max-w-xl mx-auto">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-bold mb-3">Let&apos;s write your first post.</h1>
                <p className="text-zinc-400 text-lg">Don&apos;t overthink it. What&apos;s on your mind?</p>
            </motion.div>

            {!fullContent ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                >
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., Launching a new feature..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-zinc-600"
                        onKeyDown={(e) => e.key === 'Enter' && topic && generateDemo()}
                        autoFocus
                    />
                    <button
                        onClick={generateDemo}
                        disabled={!topic || isGenerating}
                        className="absolute right-2 top-2 bottom-2 bg-white text-black font-semibold px-4 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:hover:bg-white transition-colors flex items-center gap-2"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                        {isGenerating ? 'Drafting...' : 'Magic'}
                    </button>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left"
                >
                    <div className="flex items-center gap-3 mb-4 text-zinc-400 text-sm">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        AI Draft ({persona} mode)
                    </div>

                    <div className="text-lg leading-relaxed whitespace-pre-wrap min-h-[120px]">
                        {typedContent}
                        {typedContent.length < fullContent.length && (
                            <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse align-middle" />
                        )}
                    </div>

                    {typedContent === fullContent && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-6 flex justify-end gap-3"
                        >
                            <button
                                onClick={() => setFullContent('')}
                                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => onDraftGenerated(fullContent)}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                            >
                                Continue <ArrowRight size={18} />
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
