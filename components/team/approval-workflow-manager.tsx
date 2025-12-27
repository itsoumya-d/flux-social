'use client';

import { useState, useEffect } from 'react';
import {
    Shield,
    Plus,
    Trash2,
    GripVertical,
    CheckCircle2,
    ArrowRight,
    Settings2,
    Save,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { getBrandWorkflows, saveApprovalWorkflow } from '@/app/actions/collaboration';
import { toast } from 'sonner';

interface Step {
    role: string;
    min_approvals: number;
}

interface Workflow {
    id: string;
    name: string;
    steps: Step[];
    is_default: boolean;
}

export function ApprovalWorkflowManager({ brandId }: { brandId: string }) {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [activeWorkflow, setActiveWorkflow] = useState<Partial<Workflow>>({
        name: 'Standard Agency Flow',
        steps: [
            { role: 'admin', min_approvals: 1 },
            { role: 'owner', min_approvals: 1 }
        ]
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadWorkflows();
    }, [brandId]);

    const loadWorkflows = async () => {
        try {
            const data = await getBrandWorkflows(brandId);
            setWorkflows(data as Workflow[]);
            if (data.length > 0) {
                const def = data.find((w: any) => w.is_default) || data[0];
                setActiveWorkflow(def);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddStep = () => {
        setActiveWorkflow(prev => ({
            ...prev,
            steps: [...(prev.steps || []), { role: 'admin', min_approvals: 1 }]
        }));
    };

    const handleRemoveStep = (index: number) => {
        setActiveWorkflow(prev => ({
            ...prev,
            steps: (prev.steps || []).filter((_, i) => i !== index)
        }));
    };

    const handleUpdateStep = (index: number, updates: Partial<Step>) => {
        setActiveWorkflow(prev => ({
            ...prev,
            steps: (prev.steps || []).map((s, i) => i === index ? { ...s, ...updates } : s)
        }));
    };

    const handleSave = async () => {
        if (!activeWorkflow.name || !activeWorkflow.steps?.length) {
            toast.error('Please provide a name and at least one step');
            return;
        }

        try {
            await saveApprovalWorkflow({
                id: activeWorkflow.id,
                brandId,
                name: activeWorkflow.name,
                steps: activeWorkflow.steps,
                isDefault: true // Default for now in prototype
            });
            toast.success('Workflow saved successfully! ⛓️');
            loadWorkflows();
        } catch (error) {
            toast.error('Failed to save workflow');
        }
    };

    if (isLoading) return <div className="h-40 flex items-center justify-center"><Info className="animate-pulse text-muted-foreground" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-400" />
                    <h3 className="text-sm font-bold uppercase tracking-widest">Approval Chains</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                    setActiveWorkflow({ name: 'New Workflow', steps: [{ role: 'admin', min_approvals: 1 }] });
                }} className="h-8 text-[10px] gap-2">
                    <Plus className="h-3 w-3" /> New Chain
                </Button>
            </div>

            <div className="premium-card p-6 bg-white/5 border-indigo-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Settings2 className="w-24 h-24 rotate-12" />
                </div>

                <div className="space-y-6 relative">
                    <div className="flex items-center gap-4">
                        <Input
                            value={activeWorkflow.name}
                            onChange={(e) => setActiveWorkflow(prev => ({ ...prev, name: e.target.value }))}
                            className="bg-transparent border-none text-xl font-bold p-0 focus-visible:ring-0 placeholder:opacity-20"
                            placeholder="Enter workflow name..."
                        />
                        {activeWorkflow.is_default && (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[9px] font-bold uppercase tracking-tighter">Active Protocol</Badge>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        <AnimatePresence mode="popLayout">
                            {activeWorkflow.steps?.map((step, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex items-center gap-4 group"
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400">
                                            {index + 1}
                                        </div>
                                        {index < (activeWorkflow.steps?.length || 0) - 1 && (
                                            <div className="h-8 w-px bg-indigo-500/20 my-1" />
                                        )}
                                    </div>

                                    <div className="flex-1 flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-glass-border hover:border-indigo-500/30 transition-all">
                                        <GripVertical className="h-4 w-4 text-muted-foreground/30 cursor-grab active:cursor-grabbing" />

                                        <div className="flex-1 space-y-1">
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Required Role</div>
                                            <select
                                                value={step.role}
                                                onChange={(e) => handleUpdateStep(index, { role: e.target.value })}
                                                className="bg-transparent text-sm font-bold uppercase outline-none text-indigo-300"
                                            >
                                                <option value="owner">Owner</option>
                                                <option value="admin">Admin</option>
                                                <option value="editor">Editor</option>
                                                <option value="client">Client / Approver</option>
                                            </select>
                                        </div>

                                        <div className="h-8 w-px bg-glass-border" />

                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Sign-offs</div>
                                            <input
                                                type="number"
                                                min="1"
                                                value={step.min_approvals}
                                                onChange={(e) => handleUpdateStep(index, { min_approvals: parseInt(e.target.value) })}
                                                className="bg-transparent w-12 text-sm font-bold outline-none text-center"
                                            />
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleRemoveStep(index)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    {index < (activeWorkflow.steps?.length || 0) - 1 && (
                                        <div className="text-zinc-600">
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <Button
                            variant="ghost"
                            onClick={handleAddStep}
                            className="w-full h-12 dashed-border border-2 border-dashed border-indigo-500/20 hover:bg-indigo-500/5 text-indigo-400 gap-2 text-[10px] uppercase font-bold tracking-widest mt-2"
                        >
                            <Plus className="h-4 w-4" /> Add Sequential Approval Step
                        </Button>
                    </div>

                    <div className="pt-6 flex justify-end gap-4 border-t border-glass-border">
                        <Button
                            variant="ghost"
                            className="h-10 text-[11px] uppercase tracking-widest font-bold"
                            onClick={() => loadWorkflows()}
                        >
                            Discard Changes
                        </Button>
                        <Button
                            className="h-10 px-8 bg-indigo-500 hover:bg-indigo-600 gap-2 text-[11px] uppercase tracking-widest font-bold shadow-lg shadow-indigo-500/20"
                            onClick={handleSave}
                        >
                            <Save className="h-4 w-4" /> Enforce Protocol
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex gap-4 items-start">
                <div className="p-2 rounded-lg bg-indigo-500/20">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-xs font-bold text-indigo-300">Intelligent Verification</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Posts created by <span className="text-indigo-400 font-bold">Editors</span> will automatically trigger this chain. All steps must be satisfied before scheduled publishing is finalized.
                    </p>
                </div>
            </div>
        </div>
    );
}
