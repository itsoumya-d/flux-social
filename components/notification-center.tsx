'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Clock, Zap, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { getNotifications, markAsRead } from '@/app/actions/notifications';
import { cn } from '@/lib/utils';
import { useChannel } from 'ably/react';
import { useRealtimeStatus } from '@/components/realtime-provider';

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const { isEnabled } = useRealtimeStatus();

    const fetchNotifications = async () => {
        const data = await getNotifications();
        setNotifications(data);
    };

    useEffect(() => {
        let active = true;
        getNotifications().then((data) => {
            if (active) setNotifications(data);
        });
        return () => {
            active = false;
        };
    }, []);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, is_read: true } : n
        ));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'post': return <Send className="h-4 w-4 text-primary" />;
            case 'message': return <MessageSquare className="h-4 w-4 text-blue-500" />;
            case 'alert': return <Zap className="h-4 w-4 text-amber-500" />;
            default: return <Bell className="h-4 w-4 text-muted-foreground" />;
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            {isEnabled && <NotificationListener onNotification={fetchNotifications} />}
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-white/10">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary border-2 border-background" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-0 premium-card border-glass-border bg-zinc-950/90 backdrop-blur-xl shadow-2xl" align="end">
                <div className="p-4 border-b border-glass-border flex items-center justify-between">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                            {unreadCount} NEW
                        </span>
                    )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p className="text-xs">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-glass-border">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 flex gap-4 hover:bg-white/5 transition-colors cursor-pointer relative group",
                                        !notification.is_read && "bg-white/[0.02]"
                                    )}
                                    onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                                >
                                    <div className="mt-1 h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={cn("text-xs font-bold", !notification.is_read ? "text-foreground" : "text-muted-foreground")}>
                                                {notification.title}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                                            {notification.content}
                                        </p>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {notifications.length > 0 && (
                    <div className="p-3 border-t border-glass-border text-center">
                        <Button variant="ghost" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground w-full h-8">
                            View All History
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

function NotificationListener({ onNotification }: { onNotification: () => void }) {
    useChannel('notifications', () => {
        // Refresh the list after the DB write triggered by the broadcast.
        setTimeout(onNotification, 1000);
    });

    return null;
}
