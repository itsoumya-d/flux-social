'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, AlertCircle, Share2, ThumbsUp, MessageCircle } from 'lucide-react';
import { runSimulation } from '@/app/actions/simulation';
import { toast } from 'sonner';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface SimulationModalProps {
    content: string;
    platform: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SimulationModal({ content, platform, isOpen, onOpenChange }: SimulationModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleRunSimulation = async () => {
        setIsLoading(true);
        try {
            const response = await runSimulation({ content, platform });

            if (response.success) {
                setResult(response.prediction);
            } else if (response.isGated) {
                toast.error("Upgrade to Pro to unlock Viral Predictions!");
                // Here we would ideally open the pricing modal
            } else {
                toast.error(response.error);
            }
        } catch (error) {
            toast.error("Failed to run simulation");
        } finally {
            setIsLoading(false);
        }
    };

    // Mock data for the sparkline (projected growth)
    const generateChartData = (score: number) => {
        const base = score || 50;
        return Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            views: Math.floor(base * i * (1 + Math.random() * 0.5))
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] border-none bg-black/80 backdrop-blur-xl text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <TrendingUp className="w-6 h-6 text-indigo-400" />
                        Viral Simulator
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Predict how this post will perform before you publish.
                    </DialogDescription>
                </DialogHeader>

                {!result ? (
                    <div className="flex flex-col items-center justify-center p-8 gap-4">
                        <p className="text-center text-gray-400">
                            Analyzing {content.length} characters for {platform}...
                        </p>
                        <Button
                            onClick={handleRunSimulation}
                            disabled={isLoading || content.length < 10}
                            className="bg-indigo-600 hover:bg-indigo-700 w-full"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Simulating Audience...</>
                            ) : (
                                'Run Simulation'
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Score Card */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30">
                                <span className="text-sm text-indigo-300">Viral Potential</span>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-4xl font-bold text-white">{result.engagementScore}</span>
                                    <span className="text-sm text-gray-400">/ 100</span>
                                </div>
                                <Badge className={`mt-2 ${result.viralPotential === 'high' ? 'bg-green-500/20 text-green-300' :
                                        result.viralPotential === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                            'bg-red-500/20 text-red-300'
                                    }`}>
                                    {result.viralPotential.toUpperCase()}
                                </Badge>
                            </div>

                            <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
                                <span className="text-sm text-gray-400">Projected Views (24h)</span>
                                <div className="h-[60px] w-full mt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={generateChartData(result.engagementScore)}>
                                            <Line type="monotone" dataKey="views" stroke="#818cf8" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Metrics Breakdown */}
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                            <div className="p-2 bg-gray-900/50 rounded-lg">
                                <ThumbsUp className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                                <div className="font-semibold">{result.predictedMetrics?.likes || 'N/A'}</div>
                                <div className="text-xs text-gray-500">Likes</div>
                            </div>
                            <div className="p-2 bg-gray-900/50 rounded-lg">
                                <MessageCircle className="w-4 h-4 mx-auto mb-1 text-green-400" />
                                <div className="font-semibold">{result.predictedMetrics?.comments || 'N/A'}</div>
                                <div className="text-xs text-gray-500">Comments</div>
                            </div>
                            <div className="p-2 bg-gray-900/50 rounded-lg">
                                <Share2 className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                                <div className="font-semibold">{result.predictedMetrics?.shares || 'N/A'}</div>
                                <div className="text-xs text-gray-500">Shares</div>
                            </div>
                        </div>

                        {/* Feedback */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-300">Analysis</h4>
                            {result.strengths.map((s: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-green-300/80">
                                    <TrendingUp className="w-4 h-4 mt-0.5 shrink-0" />
                                    {s}
                                </div>
                            ))}
                            {result.improvements.map((s: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-yellow-300/80">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    {s}
                                </div>
                            ))}
                        </div>

                        <Button variant="ghost" className="w-full text-gray-400 hover:text-white" onClick={() => setResult(null)}>
                            Reset Simulation
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
