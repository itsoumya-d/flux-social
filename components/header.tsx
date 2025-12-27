'use client';

import { Bell, Search, Command as CommandIcon, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserButton } from '@clerk/nextjs';
import { useChannel } from 'ably/react';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { globalSearch } from '@/app/actions/search';
import { useRouter } from 'next/navigation';
import { NotificationCenter } from './notification-center';

export function Header() {
    const { user } = useUser();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await globalSearch(searchQuery);
                setSearchResults(results);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/60 px-8 backdrop-blur-xl">
            {process.env.NEXT_PUBLIC_ABLY_API_KEY && <NotificationListener />}
            <div className="flex flex-1 items-center gap-4">
                <div className="group relative flex w-full max-w-md items-center">
                    <Search className="absolute left-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search for posts, analytics, or team..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 w-full rounded-xl border bg-muted/30 pl-10 pr-12 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    />
                    {searchQuery.length > 0 && (
                        <div className="absolute right-3">
                            {isSearching ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : null}
                        </div>
                    )}

                    {searchResults.length > 0 && (
                        <div className="absolute top-12 left-0 w-full premium-card bg-zinc-950/90 backdrop-blur-xl border-glass-border p-2 space-y-1 z-50 shadow-2xl">
                            {searchResults.map((result) => (
                                <div
                                    key={result.id}
                                    onClick={() => {
                                        router.push(result.href);
                                        setSearchQuery('');
                                        setSearchResults([]);
                                    }}
                                    className="p-3 rounded-xl hover:bg-white/5 cursor-pointer flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            {result.type === 'post' && <Search className="h-4 w-4" />}
                                            {result.type === 'member' && <User className="h-4 w-4" />}
                                            {result.type === 'command' && <Sparkles className="h-4 w-4" />}
                                        </div>
                                        <span className="text-sm font-medium">{result.title}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{result.type}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <NotificationCenter />
                <div className="h-8 w-px bg-glass-border mx-2" />
                <UserButton
                    appearance={{
                        elements: {
                            userButtonAvatarBox: "h-9 w-9 rounded-xl border-2 border-primary/20",
                            userButtonPopoverCard: "glass border-glass-border shadow-glass",
                        }
                    }}
                />
            </div>
        </header>
    );
}

function NotificationListener() {
    const { user } = useUser();
    const router = useRouter();

    useChannel('notifications', (message) => {
        const data = message.data;

        if (message.name === 'post-created') {
            if (data.creator_id !== user?.id) {
                toast.info(`New post created`, {
                    description: data.content.slice(0, 50) + '...',
                    action: {
                        label: 'View',
                        onClick: () => router.push(`/composer?id=${data.id}`)
                    }
                });
            }
        } else if (message.name === 'post-status-updated') {
            if (data.creator_id === user?.id) {
                toast(data.title, {
                    description: data.content,
                    action: {
                        label: 'Open',
                        onClick: () => router.push(`/composer?id=${data.id}`)
                    }
                });
            }
        } else if (message.name === 'new-feedback') {
            if (data.creator_id === user?.id) {
                toast.message('New Feedback', {
                    description: data.content,
                    action: {
                        label: 'View',
                        onClick: () => router.push(`/composer?id=${data.postId}`)
                    }
                });
            }
        }
    });

    return null;
}
