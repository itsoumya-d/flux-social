'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Send,
    Calendar,
    BarChart3,
    MessageSquare,
    Settings,
    Users,
    Sparkles,
    ChevronLeft,
    Box,
    Radio,
    Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { BrandSwitcher } from './brand-switcher';
import { usePresence, usePresenceListener } from 'ably/react';
import { useUser } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UsageBadge } from './ui/usage-badge';
import { useRealtimeStatus } from './realtime-provider';

const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'Composer', icon: Send, href: '/composer' },
    { name: 'Calendar', icon: Calendar, href: '/calendar' },
    { name: 'Analytics', icon: BarChart3, href: '/analytics' },
    { name: 'Community', icon: MessageSquare, href: '/community' },
    { name: 'Listening', icon: Radio, href: '/community?tab=listening', color: 'text-amber-400' },
    { name: 'Brand Voice', icon: Brain, href: '/community?tab=voice', color: 'text-purple-400' },
    { name: 'Team', icon: Users, href: '/team' },
    { name: 'AI Strategy', icon: Sparkles, href: '/ai-insights', color: 'text-indigo-400' },
];


export function Sidebar() {
    const pathname = usePathname();
    const { user } = useUser();
    const { isEnabled } = useRealtimeStatus();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "relative flex h-screen flex-col border-r bg-sidebar p-4 transition-all duration-300 glass",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className="mb-8 flex items-center gap-3 px-2">
                <div className="flex bg-primary p-2 rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
                    <Box className="h-6 w-6" />
                </div>
                {!isCollapsed && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xl font-bold tracking-tight bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent"
                    >
                        Flux.social
                    </motion.span>
                )}
            </div>

            <div className="mb-6">
                <BrandSwitcher collapsed={isCollapsed} />
            </div>

            <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.name} href={item.href}>
                            <div
                                className={cn(
                                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white/10",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-nav"
                                        className="absolute inset-0 z-0 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                                        transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                                    />
                                )}
                                <item.icon className={cn("relative z-10 h-5 w-5", isActive ? "text-primary" : (item.color || "text-muted-foreground group-hover:text-foreground"))} />
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="relative z-10 font-medium"
                                    >
                                        {item.name}
                                    </motion.span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto space-y-2 pt-4 border-t border-glass-border">
                <Link href="/settings">
                    <div className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all">
                        <Settings className="h-5 w-5" />
                        {!isCollapsed && <span className="font-medium">Settings</span>}
                    </div>
                </Link>

                {!isCollapsed && (
                    <div className="px-2 py-2">
                        <UsageBadge />
                    </div>
                )}

                {/* Team Presence Indicator */}
                {isEnabled ? (
                    <TeamPresence isCollapsed={isCollapsed} user={user} />
                ) : (
                    !isCollapsed && (
                        <div className="px-3 py-2 text-xs text-muted-foreground border-t border-glass-border">
                            Realtime disabled (No API Key)
                        </div>
                    )
                )}
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="absolute -right-3 top-10 h-6 w-6 rounded-full border bg-background shadow-md"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
            </Button>
        </aside>
    );
}

interface TeamUser {
    id: string;
    fullName: string | null | undefined;
    imageUrl: string;
}

function TeamPresence({ isCollapsed, user }: { isCollapsed: boolean, user: TeamUser | null | undefined }) {
    const { presenceData } = usePresenceListener('global-presence');

    usePresence('global-presence', {
        name: user?.fullName || 'Anonymous',
        image: user?.imageUrl,
    });

    const activeUsers = (presenceData || []) as unknown as Array<{ clientId: string; data: { name?: string; image?: string } }>;

    return (
        <div className="pt-4 border-t border-glass-border">
            <div className={cn(
                "flex items-center gap-1.5 flex-wrap px-2",
                isCollapsed ? "justify-center" : "justify-start"
            )}>
                {activeUsers.slice(0, isCollapsed ? 1 : 5).map((member: any, i: number) => (
                    <div key={i} className="relative group/member" title={member.data?.name}>
                        <Avatar className={cn(
                            "h-7 w-7 border border-white/10 ring-2 ring-transparent transition-all hover:ring-emerald-500/50 hover:scale-110",
                            member.clientId === user?.id && "border-primary/50"
                        )}>
                            <AvatarImage src={member.data?.image} />
                            <AvatarFallback className="text-[10px] bg-primary/20">{member.data?.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border border-sidebar shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                ))}
                {!isCollapsed && activeUsers.length > 5 && (
                    <div className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-muted-foreground">
                        +{activeUsers.length - 5}
                    </div>
                )}
            </div>
            {!isCollapsed && activeUsers.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-2 px-2 uppercase tracking-widest font-bold">
                    {activeUsers.length} Team {activeUsers.length === 1 ? 'is' : 'are'} Live
                </p>
            )}
        </div>
    );
}
