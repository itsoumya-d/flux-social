'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PersonaSelector } from './persona-selector';
import { MagicDraft } from './magic-draft';
import { PlatformConnect } from './platform-connect';
import { saveOnboardingData } from '@/app/actions/onboarding';

export type Persona = 'casual' | 'professional' | 'hype';

export function OnboardingWizard() {
    const [step, setStep] = useState<number>(1);
    const [persona, setPersona] = useState<Persona | null>(null);
    const [draft, setDraft] = useState<string>('');

    const nextStep = async () => {
        const next = step + 1;
        setStep(next);
        await saveOnboardingData({ step: next });
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-2xl">
                {/* Progress Bar (Subtle) */}
                <div className="flex gap-2 mb-8 justify-center">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`h-1 w-12 rounded-full transition-colors duration-500 ${i <= step ? 'bg-blue-500' : 'bg-zinc-800'
                                }`}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <PersonaSelector
                                onSelect={async (p) => {
                                    setPersona(p);
                                    await saveOnboardingData({ persona: p });
                                    nextStep();
                                }}
                            />
                        </motion.div>
                    )}

                    {step === 2 && persona && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <MagicDraft
                                persona={persona}
                                onDraftGenerated={async (content) => {
                                    setDraft(content);
                                    // We don't necessarily save draft to DB here as it goes to URL
                                    // but we mark step progress
                                    nextStep();
                                }}
                            />
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <PlatformConnect draftContent={draft} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
