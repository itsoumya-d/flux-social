'use client';

import { motion } from 'framer-motion';
import { Sparkles, Briefcase, Zap } from 'lucide-react';

interface PersonaSelectorProps {
    onSelect: (persona: 'casual' | 'professional' | 'hype') => void;
}

const personas = [
    {
        id: 'casual',
        title: 'The Creator',
        icon: Sparkles,
        description: 'Casual, authentic, and relatable. Uses emojis and lowercase.',
        color: 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500/50 hover:border-purple-400',
        textColor: 'text-purple-400'
    },
    {
        id: 'professional',
        title: 'The Executive',
        icon: Briefcase,
        description: 'Polished, authoritative, and industry-focused. Clean and crisp.',
        color: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/50 hover:border-emerald-400',
        textColor: 'text-emerald-400'
    },
    {
        id: 'hype',
        title: 'The Growth Hacker',
        icon: Zap,
        description: 'High energy, persuasive, and thread-focused. Optimised for viral reach.',
        color: 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/50 hover:border-orange-400',
        textColor: 'text-orange-400'
    }
] as const;

export function PersonaSelector({ onSelect }: PersonaSelectorProps) {
    return (
        <div className="text-center">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-bold mb-3 tracking-tight">How do you want to sound?</h1>
                <p className="text-zinc-400 text-lg">Select your default AI writing personality.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {personas.map((p, i) => (
                    <motion.button
                        key={p.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        whileHover={{ scale: 1.02, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(p.id)}
                        className={`group relative p-6 rounded-2xl border backdrop-blur-sm text-left transition-all duration-300 ${p.color}`}
                    >
                        <div className={`p-3 rounded-xl bg-white/5 w-fit mb-4 group-hover:scale-110 transition-transform ${p.textColor}`}>
                            <p.icon size={24} />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{p.title}</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">{p.description}</p>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
