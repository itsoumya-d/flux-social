'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Sliders,
    Sparkles,
    Brain,
    BookOpen,
    Save,
    RefreshCw,
    CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface BrandVoiceConfigProps {
    brandId?: string;
}

export function BrandVoiceConfig({ brandId }: BrandVoiceConfigProps) {
    const [voice, setVoice] = useState({
        name: 'Default Brand Voice',
        formality: 0.5,
        enthusiasm: 0.6,
        humor: 0.3,
        technicality: 0.4,
        keyPhrases: ['innovative', 'seamless', 'empowering'],
        avoidPhrases: ['cheap', 'basic', 'simple'],
    });

    const [sampleContent, setSampleContent] = useState('');
    const [isTraining, setIsTraining] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSliderChange = (key: keyof typeof voice, value: number) => {
        setVoice(prev => ({ ...prev, [key]: value }));
    };

    const handleTrain = async () => {
        if (!sampleContent.trim()) return;

        setIsTraining(true);
        // Simulate training with API call
        await new Promise(r => setTimeout(r, 2000));

        // Update voice based on "training"
        setVoice(prev => ({
            ...prev,
            formality: Math.random() * 0.4 + 0.3,
            enthusiasm: Math.random() * 0.4 + 0.4,
            humor: Math.random() * 0.3 + 0.1,
        }));

        setIsTraining(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(r => setTimeout(r, 1000));
        setIsSaving(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const getSliderDescription = (key: string, value: number): string => {
        const descriptions: Record<string, [string, string]> = {
            formality: ['Casual & Friendly', 'Formal & Professional'],
            enthusiasm: ['Calm & Measured', 'Energetic & Upbeat'],
            humor: ['Serious & Direct', 'Playful & Witty'],
            technicality: ['Simple & Clear', 'Technical & Detailed'],
        };
        const [low, high] = descriptions[key] || ['Low', 'High'];
        return value < 0.4 ? low : value > 0.6 ? high : 'Balanced';
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-400" />
                        AI Brand Voice
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Configure how AI generates content in your brand's unique voice
                    </p>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2 bg-gradient-to-r from-violet-500 to-purple-500"
                >
                    {isSaving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : showSuccess ? (
                        <CheckCircle2 className="w-4 h-4" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {isSaving ? 'Saving...' : showSuccess ? 'Saved!' : 'Save Voice'}
                </Button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Tone Sliders */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
                >
                    <h3 className="text-lg font-medium flex items-center gap-2 mb-6">
                        <Sliders className="w-5 h-5 text-blue-400" />
                        Voice Tone
                    </h3>

                    <div className="space-y-6">
                        {(['formality', 'enthusiasm', 'humor', 'technicality'] as const).map((key) => (
                            <div key={key} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-gray-300 capitalize">{key}</label>
                                    <span className="text-sm text-gray-400">
                                        {getSliderDescription(key, voice[key])}
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={voice[key]}
                                        onChange={(e) => handleSliderChange(key, parseFloat(e.target.value))}
                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none
                               [&::-webkit-slider-thumb]:w-4
                               [&::-webkit-slider-thumb]:h-4
                               [&::-webkit-slider-thumb]:rounded-full
                               [&::-webkit-slider-thumb]:bg-gradient-to-r
                               [&::-webkit-slider-thumb]:from-violet-500
                               [&::-webkit-slider-thumb]:to-purple-500
                               [&::-webkit-slider-thumb]:cursor-pointer
                               [&::-webkit-slider-thumb]:shadow-lg"
                                    />
                                    <div
                                        className="absolute top-0 left-0 h-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg pointer-events-none"
                                        style={{ width: `${voice[key] * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Key Phrases */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
                >
                    <h3 className="text-lg font-medium flex items-center gap-2 mb-6">
                        <BookOpen className="w-5 h-5 text-emerald-400" />
                        Vocabulary
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <label className="text-sm text-gray-300 mb-2 block">Key Phrases to Use</label>
                            <div className="flex flex-wrap gap-2">
                                {voice.keyPhrases.map((phrase, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm flex items-center gap-2"
                                    >
                                        {phrase}
                                        <button
                                            onClick={() => {
                                                setVoice(prev => ({
                                                    ...prev,
                                                    keyPhrases: prev.keyPhrases.filter((_, idx) => idx !== i)
                                                }));
                                            }}
                                            className="hover:text-emerald-300"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                <button
                                    onClick={() => {
                                        const phrase = prompt('Enter a phrase to use:');
                                        if (phrase) {
                                            setVoice(prev => ({
                                                ...prev,
                                                keyPhrases: [...prev.keyPhrases, phrase]
                                            }));
                                        }
                                    }}
                                    className="px-3 py-1 border border-dashed border-white/20 text-gray-400 rounded-full text-sm hover:border-white/40 transition-colors"
                                >
                                    + Add
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-gray-300 mb-2 block">Phrases to Avoid</label>
                            <div className="flex flex-wrap gap-2">
                                {voice.avoidPhrases.map((phrase, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm flex items-center gap-2"
                                    >
                                        {phrase}
                                        <button
                                            onClick={() => {
                                                setVoice(prev => ({
                                                    ...prev,
                                                    avoidPhrases: prev.avoidPhrases.filter((_, idx) => idx !== i)
                                                }));
                                            }}
                                            className="hover:text-red-300"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                <button
                                    onClick={() => {
                                        const phrase = prompt('Enter a phrase to avoid:');
                                        if (phrase) {
                                            setVoice(prev => ({
                                                ...prev,
                                                avoidPhrases: [...prev.avoidPhrases, phrase]
                                            }));
                                        }
                                    }}
                                    className="px-3 py-1 border border-dashed border-white/20 text-gray-400 rounded-full text-sm hover:border-white/40 transition-colors"
                                >
                                    + Add
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Train from Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6"
            >
                <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Train from Sample Content
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                    Paste examples of your best-performing content and AI will learn your brand's unique voice.
                </p>

                <Textarea
                    value={sampleContent}
                    onChange={(e) => setSampleContent(e.target.value)}
                    placeholder="Paste 3-5 examples of your brand's social media posts here. Include posts from different platforms if possible..."
                    className="min-h-[120px] bg-white/5 border-white/10 mb-4"
                />

                <Button
                    onClick={handleTrain}
                    disabled={isTraining || !sampleContent.trim()}
                    className="gap-2"
                    variant="outline"
                >
                    {isTraining ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Training AI...
                        </>
                    ) : (
                        <>
                            <Brain className="w-4 h-4" />
                            Train Voice from Content
                        </>
                    )}
                </Button>
            </motion.div>

            {/* Preview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
            >
                <h3 className="text-lg font-medium mb-4">Voice Preview</h3>
                <p className="text-gray-400 text-sm mb-4">
                    Based on your current settings, AI will generate content like this:
                </p>

                <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                    <p className="text-gray-300 italic">
                        {voice.formality > 0.6
                            ? "We're pleased to announce our latest innovation in social media management."
                            : voice.formality < 0.4
                                ? "🚀 Big news! We just dropped something amazing for all you content creators!"
                                : "Excited to share our new feature that makes content creation even easier."
                        }
                        {voice.humor > 0.5 && " (And yes, it's as cool as it sounds! 😎)"}
                        {voice.enthusiasm > 0.6 && " Can't wait to see what you create with it!"}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
