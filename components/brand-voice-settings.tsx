'use client';

import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Save, Plus, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { addStyleExample, getStyleVault, removeStyleExample } from '@/app/actions/ai';
import { getBrandVoice, saveBrandVoice } from '@/app/actions/brand-voice';

interface BrandVoiceSettingsProps {
    brandId: string;
}

export function BrandVoiceSettings({ brandId }: BrandVoiceSettingsProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [examples, setExamples] = useState<any[]>([]);
    const [newExample, setNewExample] = useState('');

    // Tone States
    const [tones, setTones] = useState({
        formality: 0.5,
        enthusiasm: 0.5,
        humor: 0.3,
        technicality: 0.5
    });

    async function loadBrandVoice() {
        const voice = await getBrandVoice(brandId);
        if (voice) {
            setTones({
                formality: voice.tone_formality || 0.5,
                enthusiasm: voice.tone_enthusiasm || 0.5,
                humor: voice.tone_humor || 0.3,
                technicality: voice.tone_technicality || 0.5
            });
        }
    }

    async function handleSaveProfile() {
        setSaving(true);
        const res = await saveBrandVoice(brandId, {
            toneFormality: tones.formality,
            toneEnthusiasm: tones.enthusiasm,
            toneHumor: tones.humor,
            toneTechnicality: tones.technicality
        });
        if (!res.error) {
            toast.success('Tone profile saved');
        } else {
            toast.error('Failed to save profile');
        }
        setSaving(false);
    }

    async function loadStyleVault() {
        setLoading(true);
        const res = await getStyleVault(brandId);
        if (res.success) {
            setExamples(res.examples || []);
        }
        setLoading(false);
    }

    useEffect(() => {
        loadStyleVault();
        loadBrandVoice();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [brandId]);

    async function handleAddExample() {
        if (!newExample.trim()) return;
        setSaving(true);
        const res = await addStyleExample(brandId, newExample);
        if (res.success) {
            toast.success('Style example added to vault');
            setNewExample('');
            loadStyleVault();
        } else {
            toast.error('Failed to add example');
        }
        setSaving(false);
    }

    async function handleRemoveExample(id: string) {
        const res = await removeStyleExample(id);
        if (res.success) {
            toast.success('Example removed');
            setExamples(examples.filter(e => e.id !== id));
        }
    }

    return (
        <div className="space-y-8 max-w-4xl animate-in fade-in duration-500">
            {/* Tone Profile Section */}
            <div className="premium-card p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-glass-border pb-4 mb-4">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                        <Brain className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Tone Profile</h2>
                        <p className="text-xs text-muted-foreground">Calibrate the personality of your AI generator.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {[
                        { key: 'formality', label: 'Formality', left: 'Casual', right: 'Professional' },
                        { key: 'enthusiasm', label: 'Enthusiasm', left: 'Reserved', right: 'Energetic' },
                        { key: 'humor', label: 'Humor', left: 'Serious', right: 'Witty' },
                        { key: 'technicality', label: 'Technicality', left: 'Simple', right: 'Expert' },
                    ].map((tone) => (
                        <div key={tone.key} className="space-y-4">
                            <div className="flex justify-between text-xs font-medium">
                                <span>{tone.label}</span>
                                <span className="text-muted-foreground">{Math.round((tones as any)[tone.key] * 100)}%</span>
                            </div>
                            <Slider
                                value={[(tones as any)[tone.key]]}
                                max={1}
                                step={0.05}
                                onValueChange={([val]) => setTones(t => ({ ...t, [tone.key]: val }))}
                                className="z-10"
                            />
                            <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground/50 font-bold">
                                <span>{tone.left}</span>
                                <span>{tone.right}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        variant="outline"
                        disabled={saving}
                        className="premium-button gap-2 border-indigo-500/20 hover:bg-indigo-500/10 text-indigo-400"
                        onClick={handleSaveProfile}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Profile
                    </Button>
                </div>
            </div>

            {/* Style Vault Section */}
            <div className="premium-card p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-glass-border pb-4 mb-4">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Style Vault (RAG)</h2>
                        <p className="text-xs text-muted-foreground">Store actual examples of your writing style. AI will learn from these.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <Textarea
                        placeholder="Paste a high-performing post or a writing sample here..."
                        value={newExample}
                        onChange={(e) => setNewExample(e.target.value)}
                        className="bg-white/5 border-glass-border min-h-[120px] focus:ring-emerald-500/20"
                    />
                    <div className="flex justify-end">
                        <Button
                            onClick={handleAddExample}
                            disabled={saving || !newExample.trim()}
                            className="bg-emerald-600 hover:bg-emerald-500 gap-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Add to Vault
                        </Button>
                    </div>
                </div>

                <div className="pt-6 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Stored Samples ({examples.length})</h3>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : examples.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-glass-border rounded-xl">
                            <p className="text-sm text-muted-foreground">Your vault is empty. Add samples to improve AI accuracy.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {examples.map((ex) => (
                                <div key={ex.id} className="p-4 rounded-xl bg-white/5 border border-glass-border flex justify-between items-start gap-4 hover:bg-white/10 transition-colors group">
                                    <div className="text-sm line-clamp-3 text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                                        {ex.content}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveExample(ex.id)}
                                        className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
