"use server";

import { createClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { getMessages } from "./messages";
import { getSocialMentions } from "./social-listening";

export type FeedItemType = "message" | "mention";

export interface FeedItem {
    id: string;
    type: FeedItemType;
    platform: string;
    content: string;
    sender_name: string;
    sender_handle: string;
    sender_avatar: string;
    created_at: string;
    sentiment: "positive" | "negative" | "neutral" | "mixed";
    priority_score: number;
    is_read: boolean;
    is_important: boolean;
    is_resolved: boolean;
    assigned_to?: string | null;
    raw_data: any; // Keep original object for reference
}

export async function getUnifiedFeed(
    brandId: string,
    options: {
        platform?: string;
        sentiment?: string;
        isResolved?: boolean;
        limit?: number;
    } = {}
) {
    // const { userId } = await auth();
    // if (!userId) return [];
    // For prototype/demo, we allow fetching without strict auth if brandId is valid

    // Fetch both streams in parallel
    let messages = [];
    let mentions: any[] = [];

    try {
        const [msgResult, mentResult] = await Promise.all([
            getMessages(brandId, {
                platform: options.platform,
                sentiment: options.sentiment,
                isRead: options.isResolved === undefined ? undefined : !options.isResolved,
            }),
            getSocialMentions(brandId, {
                platform: options.platform as any,
                sentiment: options.sentiment as any,
            }),
        ]);
        messages = msgResult || [];
        mentions = mentResult.mentions || [];
    } catch (err) {
        console.error("Error fetching feed:", err);
        // Do NOT provide mock data on error. 
        // This ensures the user sees an empty state or error state if real data fails.
        messages = [];
        mentions = [];
    }


    // Normalize into FeedItems
    const feedItems: FeedItem[] = [
        ...messages.map((m: any) => ({
            id: m.id,
            type: "message" as const,
            platform: m.platform,
            content: m.content,
            sender_name: m.sender_name,
            sender_handle: m.sender_handle,
            sender_avatar: m.sender_avatar,
            created_at: m.created_at,
            sentiment: m.sentiment || "neutral",
            priority_score: m.priority_score || 0,
            is_read: m.is_read,
            is_important: m.is_important,
            is_resolved: m.is_read, // For now mapping read to resolved
            assigned_to: m.assigned_to,
            raw_data: m,
        })),
        ...mentions.map((m: any) => ({
            id: m.id,
            type: "mention" as const,
            platform: m.platform,
            content: m.content,
            sender_name: m.author_name || "Unknown Author",
            sender_handle: m.author_handle || "@anonymous",
            sender_avatar: m.author_avatar || `https://i.pravatar.cc/150?u=${m.id}`,
            created_at: m.discovered_at || m.created_at,
            sentiment: m.sentiment || "neutral",
            priority_score: m.reach_estimate ? Math.min(100, m.reach_estimate / 100) : 50, // Mock priority for mentions
            is_read: false,
            is_important: m.is_influencer || false,
            is_resolved: m.responded_at ? true : false,
            assigned_to: null,
            raw_data: m,
        })),
    ];

    // Global sort by priority score then date
    return feedItems.sort((a, b) => {
        if (b.priority_score !== a.priority_score) {
            return b.priority_score - a.priority_score;
        }
        return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    });
}
