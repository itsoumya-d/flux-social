'use client';

import { motion } from 'framer-motion';
import { Twitter, Linkedin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PlatformConnectProps {
    draftContent: string;
}

export function PlatformConnect({ draftContent }: PlatformConnectProps) {
    const router = useRouter();

    const handleSkip = () => {
        // In a real app, we'd save the draft to local storage or DB here
        router.push('/composer?draft=' + encodeURIComponent(draftContent));
    };

    return (
        <div className="text-center max-w-xl mx-auto">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-bold mb-3">Where should we post this?</h1>
                <p className="text-zinc-400 text-lg">Connect a focused channel to ship your first post.</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-8 text-left backdrop-blur-sm"
            >
                <div className="text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Your Draft</div>
                <p className="text-zinc-300 italic line-clamp-2">"{draftContent}"</p>
            </motion.div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <button className="group flex items-center justify-center gap-3 p-5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all duration-300">
                    <Twitter className="fill-current text-white group-hover:text-blue-400" />
                    <span className="font-semibold text-zinc-300 group-hover:text-white">Twitter / X</span>
                </button>

                <button className="group flex items-center justify-center gap-3 p-5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-blue-600/10 hover:border-blue-600/50 transition-all duration-300">
                    <Linkedin className="fill-current text-white group-hover:text-blue-500" />
                    <span className="font-semibold text-zinc-300 group-hover:text-white">LinkedIn</span>
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <button
                    onClick={handleSkip}
                    className="text-zinc-500 hover:text-white transition-colors text-sm flex items-center gap-2 mx-auto"
                >
                    Skip for now, I'll connect later <ArrowRight size={14} />
                </button>
            </motion.div>
        </div>
    );
}
