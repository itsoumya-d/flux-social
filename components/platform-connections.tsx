'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Twitter,
    Instagram,
    Linkedin,
    Facebook,
    Youtube,
    Plus,
    Check,
    X,
    Loader2,
    RefreshCw,
    ExternalLink,
    Unplug
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { PlatformType } from '@/lib/types';
import { getOAuthUrl } from '@/app/actions/oauth';
import { syncBrandData } from '@/app/actions/sync';

// Custom icons for platforms without Lucide icons
function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
    );
}

function PinterestIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.4.04-3.44l1.4-5.97s-.36-.72-.36-1.78c0-1.66.96-2.91 2.16-2.91 1.02 0 1.52.77 1.52 1.69 0 1.03-.66 2.57-1 4a1.75 1.75 0 0 0 1.79 2.18c2.14 0 3.79-2.26 3.79-5.52 0-2.88-2.07-4.9-5.03-4.9a5.22 5.22 0 0 0-5.44 5.23c0 1.03.4 2.14.9 2.75a.36.36 0 0 1 .08.35l-.33 1.36c-.05.23-.18.28-.42.17-1.56-.72-2.53-3-2.53-4.85 0-3.95 2.87-7.58 8.28-7.58 4.35 0 7.73 3.1 7.73 7.23 0 4.32-2.72 7.8-6.5 7.8-1.27 0-2.47-.66-2.88-1.44l-.78 2.99c-.28 1.1-1.05 2.48-1.56 3.33A12 12 0 1 0 12 0z" />
        </svg>
    );
}

const PLATFORM_CONFIG: Record<PlatformType, {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    description: string;
}> = {
    twitter: {
        name: 'X / Twitter',
        icon: Twitter,
        color: 'text-[#1DA1F2]',
        bgColor: 'bg-[#1DA1F2]/10',
        description: 'Post tweets, threads, and engage with followers',
    },
    instagram: {
        name: 'Instagram',
        icon: Instagram,
        color: 'text-[#E1306C]',
        bgColor: 'bg-[#E1306C]/10',
        description: 'Share photos, reels, and stories',
    },
    linkedin: {
        name: 'LinkedIn',
        icon: Linkedin,
        color: 'text-[#0A66C2]',
        bgColor: 'bg-[#0A66C2]/10',
        description: 'Professional posts and company updates',
    },
    facebook: {
        name: 'Facebook',
        icon: Facebook,
        color: 'text-[#1877F2]',
        bgColor: 'bg-[#1877F2]/10',
        description: 'Manage pages and schedule posts',
    },
    tiktok: {
        name: 'TikTok',
        icon: TikTokIcon,
        color: 'text-white',
        bgColor: 'bg-black/50',
        description: 'Upload and schedule short videos',
    },
    pinterest: {
        name: 'Pinterest',
        icon: PinterestIcon,
        color: 'text-[#E60023]',
        bgColor: 'bg-[#E60023]/10',
        description: 'Create and schedule pins',
    },
    youtube: {
        name: 'YouTube',
        icon: Youtube,
        color: 'text-[#FF0000]',
        bgColor: 'bg-[#FF0000]/10',
        description: 'Upload videos and manage content',
    },
    threads: {
        name: 'Threads',
        icon: () => <span className="text-lg">@</span>,
        color: 'text-white',
        bgColor: 'bg-black/50',
        description: 'Share thoughts and updates',
    },
    bluesky: {
        name: 'Bluesky',
        icon: () => <span className="text-lg">☁</span>,
        color: 'text-[#0085FF]',
        bgColor: 'bg-[#0085FF]/10',
        description: 'Connect via app password',
    },
    google_business: {
        name: 'Google Business',
        icon: () => <span className="text-lg">📍</span>,
        color: 'text-[#4285F4]',
        bgColor: 'bg-[#4285F4]/10',
        description: 'Manage local business posts',
    },
};

interface ConnectedPlatform {
    id: string;
    type: PlatformType;
    profile_name: string;
    profile_avatar: string | null;
    is_active: boolean;
    last_synced_at: string;
}

interface PlatformConnectionsProps {
    brandId?: string;
    connectedPlatforms?: ConnectedPlatform[];
}

export function PlatformConnections({ brandId, connectedPlatforms = [] }: PlatformConnectionsProps) {
    const [connected, setConnected] = useState<ConnectedPlatform[]>(connectedPlatforms);
    const [connecting, setConnecting] = useState<PlatformType | null>(null);

    const isConnected = (platform: PlatformType) =>
        connected.some(p => p.type === platform && p.is_active);

    const handleConnect = async (platform: PlatformType) => {
        if (!brandId) {
            toast.error('No brand selected');
            return;
        }

        setConnecting(platform);

        try {
            const redirectUri = `${window.location.origin}/api/oauth/callback`;
            const { url, error } = await getOAuthUrl(platform, brandId, redirectUri);

            if (error || !url) {
                toast.error(error || 'Failed to get authorization URL');
                return;
            }

            // Redirect to platform OAuth page
            window.location.href = url;
        } catch (error) {
            toast.error('Failed to initiate connection');
            console.error(error);
        } finally {
            setConnecting(null);
        }
    };

    const handleSync = async () => {
        if (!brandId) return;

        const toastId = toast.loading('Syncing real-time data...');
        try {
            const result = await syncBrandData(brandId);
            if (result.success) {
                toast.success(`Sync complete! ${result.syncedItems} items updated.`, { id: toastId });
                // In production, we might want to refresh the page or state
                window.location.reload();
            } else {
                toast.error(result.error || 'Sync failed', { id: toastId });
            }
        } catch (error) {
            toast.error('Sync failed', { id: toastId });
        }
    };

    const handleDisconnect = async (platformId: string, platform: PlatformType) => {
        try {
            setConnected(prev => prev.filter(p => p.id !== platformId));
            toast.success(`${PLATFORM_CONFIG[platform].name} disconnected`);
        } catch {
            toast.error('Failed to disconnect');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Connected Platforms</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        {connected.filter(p => p.is_active).length} of 10 platforms connected
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleSync}
                >
                    <RefreshCw className="w-4 h-4" />
                    Sync All
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Object.keys(PLATFORM_CONFIG) as PlatformType[]).map((platform) => {
                    const config = PLATFORM_CONFIG[platform];
                    const connection = connected.find(p => p.type === platform && p.is_active);
                    const Icon = config.icon;
                    const isLoading = connecting === platform;

                    return (
                        <motion.div
                            key={platform}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`
                relative rounded-xl border p-5 transition-all
                ${connection
                                    ? 'bg-white/5 border-white/20'
                                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                                }
              `}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${config.bgColor}`}>
                                    <Icon className={`w-6 h-6 ${config.color}`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{config.name}</h3>
                                        {connection && (
                                            <span className="flex items-center gap-1 text-xs text-emerald-400">
                                                <Check className="w-3 h-3" />
                                                Connected
                                            </span>
                                        )}
                                    </div>

                                    {connection ? (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-300">{connection.profile_name}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Last synced: {new Date(connection.last_synced_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {config.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4">
                                {connection ? (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 gap-1.5"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Manage
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDisconnect(connection.id, platform)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        >
                                            <Unplug className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => handleConnect(platform)}
                                        disabled={isLoading}
                                        className={`w-full gap-2 ${config.bgColor} ${config.color} hover:opacity-80`}
                                        variant="ghost"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Plus className="w-4 h-4" />
                                        )}
                                        {isLoading ? 'Connecting...' : 'Connect'}
                                    </Button>
                                )}
                            </div>

                            {/* Status indicator */}
                            {connection && (
                                <div className="absolute top-3 right-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
