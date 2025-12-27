'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import {
    Settings,
    User,
    Shield,
    Bell,
    Globe,
    CreditCard,
    ChevronRight,
    LogOut,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useClerk } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlatformConnections } from '@/components/platform-connections';
import { toast } from 'sonner';
import { getActiveBrandId } from '@/app/actions/workspace';
import { ensureDefaultBrand } from '@/app/actions/brands';
import { getConnectedPlatforms } from '@/app/actions/oauth';
import { BrandVoiceSettings } from '@/components/brand-voice-settings';
import { AutoTopupSettings } from '@/components/settings/auto-topup-settings';
import { getUserProfile } from '@/app/actions/user';

function SettingsContent() {
    const searchParams = useSearchParams();
    const { user } = useUser();
    const { signOut } = useClerk();
    const [activeTab, setActiveTab] = useState('general');
    const [brandId, setBrandId] = useState<string | null>(null);
    const [connectedPlatforms, setConnectedPlatforms] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const initData = async () => {
            try {
                let id = await getActiveBrandId();
                if (!id) {
                    const defaultBrand = await ensureDefaultBrand();
                    id = defaultBrand.id;
                }
                setBrandId(id || null);

                if (id) {
                    const { platforms } = await getConnectedPlatforms(id);
                    setConnectedPlatforms(platforms || []);
                }

                const userProfile = await getUserProfile();
                setProfile(userProfile);
            } catch (error) {
                console.error('Error fetching settings data:', error);
            }
        };
        initData();
    }, []);

    // Handle OAuth callbacks
    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const platform = searchParams.get('platform');

        if (success === 'connected' && platform) {
            toast.success(`${platform} connected successfully!`);
            setActiveTab('platforms');
        } else if (error && platform) {
            toast.error(`Failed to connect ${platform}: ${error}`);
            setActiveTab('platforms');
        }
    }, [searchParams]);

    const sections = [
        { title: 'Profile', description: `Connected as ${user?.primaryEmailAddress?.emailAddress || 'User Profile'}`, icon: User },
        { title: 'Security', description: '2FA, password management, and active sessions.', icon: Shield },
        { title: 'Notifications', description: 'Configure alerts for engagement and AI briefing.', icon: Bell },
        { title: 'Billing & Plan', description: 'View invoices and upgrade your Flux subscription.', icon: CreditCard },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground text-sm">Fine-tune your Flux Social experience.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-white/5 border border-white/10 mb-6">
                    <TabsTrigger value="general" className="gap-2">
                        <Settings className="w-4 h-4" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="platforms" className="gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                        <Globe className="w-4 h-4" />
                        Platforms
                    </TabsTrigger>
                    <TabsTrigger value="voice" className="gap-2 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400">
                        <Sparkles className="w-4 h-4" />
                        Brand Voice
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="gap-2 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                        <CreditCard className="w-4 h-4" />
                        Billing & Topup
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <div className="space-y-4">
                        {sections.map((section, i) => (
                            <div key={i} className="premium-card p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-xl bg-white/5 text-muted-foreground group-hover:text-primary transition-colors">
                                        <section.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold">{section.title}</h3>
                                        <p className="text-xs text-muted-foreground">{section.description}</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-glass-border mt-8">
                        <Button
                            variant="ghost"
                            onClick={() => signOut()}
                            className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 gap-2"
                        >
                            <LogOut className="h-4 w-4" /> Sign Out
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                        {[
                            { name: 'Supabase DB', status: 'Operational', color: 'bg-emerald-500' },
                            { name: 'Ably Realtime', status: 'Operational', color: 'bg-emerald-500' },
                            { name: 'OpenAI API', status: 'Operational', color: 'bg-emerald-500' },
                        ].map((s, i) => (
                            <div key={i} className="p-4 rounded-xl border border-glass-border bg-white/5 flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">{s.name}</span>
                                <div className="flex items-center gap-2">
                                    <div className={cn("h-1.5 w-1.5 rounded-full", s.color)} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{s.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="platforms">
                    <PlatformConnections
                        brandId={brandId || undefined}
                        connectedPlatforms={connectedPlatforms}
                    />
                </TabsContent>

                <TabsContent value="voice">
                    {brandId ? (
                        <BrandVoiceSettings brandId={brandId} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-glass-border rounded-xl">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground">Initializing Brand Voice...</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="billing">
                    <div className="premium-card p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold">Credit Management</h2>
                            <p className="text-xs text-muted-foreground">Manage your balance and automated top-up rules.</p>
                        </div>
                        {profile ? (
                            <AutoTopupSettings initialProfile={profile} />
                        ) : (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <SettingsContent />
        </Suspense>
    );
}

