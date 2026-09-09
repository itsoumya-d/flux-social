'use client';

import { usePresence, usePresenceListener } from 'ably/react';
import { useUser } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRealtimeStatus } from '@/components/realtime-provider';

export function TeamPresence() {
    const { user } = useUser();
    const { isEnabled } = useRealtimeStatus();
    const [activeUsers, setActiveUsers] = useState<any[]>([]);

    return (
        <div className="space-y-4">
            {isEnabled && (
                <TeamPresenceRealtime user={user} setActiveUsers={setActiveUsers} />
            )}
            <AnimatePresence mode="popLayout">
                {activeUsers.length > 0 ? (
                    <div className="space-y-3">
                        {activeUsers.map((member: any, i: number) => (
                            <motion.div
                                key={member.clientId || i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="h-9 w-9 border border-primary/20">
                                            <AvatarImage src={member.data?.image} />
                                            <AvatarFallback>{member.data?.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#09090b] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{member.data?.name} {member.clientId === user?.id && '(You)'}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Now</p>
                                    </div>
                                </div>
                                <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-500 font-bold uppercase tracking-tight">
                                    Online
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 opacity-30">
                        <div className="h-12 w-12 rounded-full border-2 border-dashed border-muted-foreground mb-3 animate-spin-slow" />
                        <p className="text-xs italic text-center">Waiting for team activity...</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function TeamPresenceRealtime({ user, setActiveUsers }: { user: any, setActiveUsers: (users: any[]) => void }) {
    usePresence('global-presence', {
        name: user?.fullName || 'Anonymous',
        image: user?.imageUrl,
    });

    const { presenceData } = usePresenceListener('global-presence');

    useEffect(() => {
        if (presenceData) {
            setActiveUsers(presenceData as any[]);
        }
    }, [presenceData, setActiveUsers]);

    return null;
}
