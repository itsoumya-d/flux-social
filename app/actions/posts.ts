'use server';

import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { publishToAyrshare } from '@/lib/ayrshare';
import * as Ably from 'ably';
import { createNotification } from './notifications';
import { getAllProfiles } from './profiles';

// Lazy initialization to prevent build failures when ABLY_API_KEY is not set
let ablyClient: Ably.Rest | null = null;

function getAblyClient(): Ably.Rest {
    if (!ablyClient) {
        const key = process.env.NEXT_PUBLIC_ABLY_API_KEY;
        if (!key) {
            throw new Error('NEXT_PUBLIC_ABLY_API_KEY environment variable is not set');
        }
        ablyClient = new Ably.Rest({ key });
    }
    return ablyClient;
}

export async function createPost(postData: {
    brandId: string;
    content: string;
    platforms: string[];
    scheduledAt?: string;
    mediaUrls?: string[];
    requiresReview?: boolean;
    // NEW: First Comment Scheduling (Buffer feature - critical for Instagram engagement)
    firstComment?: string;
    // NEW: Recurring Posts (Buffer doesn't have this - competitive advantage)
    recurringConfig?: {
        enabled: boolean;
        frequency: 'daily' | 'weekly' | 'monthly';
        endDate?: string;
        maxOccurrences?: number;
    };
    platformOverrides?: Record<string, string>;
}) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
        .from('posts')
        .insert({
            brand_id: postData.brandId,
            creator_id: userId,
            content: postData.content,
            platforms: postData.platforms,
            scheduled_at: postData.scheduledAt,
            media_urls: postData.mediaUrls || [],
            status: postData.requiresReview ? 'draft' : (postData.scheduledAt ? 'scheduled' : 'draft'),
            requires_review: postData.requiresReview || false,
            // NEW: First Comment Scheduling (critical for Instagram engagement)
            first_comment: postData.firstComment || null,
            // NEW: Recurring Posts configuration
            recurring_config: postData.recurringConfig || null,
            is_recurring: postData.recurringConfig?.enabled || false,
            platform_specific_content: postData.platformOverrides || {}
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating post:', error);
        throw new Error('Failed to create post');
    }

    // Attempt to publish to Ayrshare with First Comment support
    try {
        await publishToAyrshare({
            post: postData.content,
            platforms: postData.platforms,
            scheduleDate: postData.scheduledAt,
            // Use platform override if available
            ...(postData.platformOverrides && {
                overrides: postData.platformOverrides
            }),
            // Include first comment for Instagram (Buffer feature)
            ...(postData.firstComment && postData.platforms.includes('instagram') && {
                instagramOptions: {
                    firstComment: postData.firstComment
                }
            })
        });
    } catch (err) {
        console.error('Ayrshare scheduling failed:', err);
    }

    // Notify other users via Ably and persistence
    try {
        const channel = getAblyClient().channels.get('notifications');
        const payload = {
            id: data.id,
            content: data.content,
            platforms: data.platforms,
            creator_id: userId
        };
        await channel.publish('post-created', payload);

        // Persistent notifications for other team members
        const allProfiles = await getAllProfiles();
        const others = allProfiles.filter(p => p.id !== userId);

        for (const profile of others) {
            await createNotification(
                profile.id,
                'New Post Created',
                `A new post for ${data.platforms.join(', ')} has been drafted by a teammate.`,
                'post'
            );
        }
    } catch (err) {
        console.error('Notification logic failed:', err);
    }

    return data;
}

export async function getPosts(brandId: string) {
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching posts:', error);
        return [];
    }

    return data;
}
export async function approvePost(postId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { data, error } = await supabase
        .from('posts')
        .update({
            status: 'scheduled',
            requires_review: false,
            reviewer_id: userId,
            updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

    if (error) {
        console.error('Error approving post:', error);
        throw new Error('Failed to approve post');
    }

    // Notify creator
    try {
        const channel = getAblyClient().channels.get('notifications');
        await channel.publish('post-status-updated', {
            id: data.id,
            status: 'scheduled',
            creator_id: data.creator_id,
            title: 'Post Approved',
            content: `Your post for ${data.platforms.join(', ')} was approved.`
        });

        await createNotification(
            data.creator_id,
            'Post Approved',
            `Your post for ${data.platforms.join(', ')} has been approved and moved to the schedule.`,
            'post'
        );
    } catch (err) {
        console.error('Failed to notify creator:', err);
    }

    return data;
}

export async function updatePost(postId: string, postData: {
    content: string;
    platforms: string[];
    scheduledAt?: string;
    mediaUrls?: string[];
    requiresReview?: boolean;
    platformOverrides?: Record<string, string>;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { data, error } = await supabase
        .from('posts')
        .update({
            content: postData.content,
            platforms: postData.platforms,
            scheduled_at: postData.scheduledAt,
            media_urls: postData.mediaUrls || [],
            requires_review: postData.requiresReview || false,
            // If it was 'needs_changes', move it back to 'draft' or 'scheduled' if review is no longer required
            status: postData.requiresReview ? 'draft' : (postData.scheduledAt ? 'scheduled' : 'draft'),
            platform_specific_content: postData.platformOverrides || {},
            updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

    if (error) {
        console.error('Error updating post:', error);
        throw new Error('Failed to update post');
    }

    return data;
}

export async function rejectPost(postId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { data, error } = await supabase
        .from('posts')
        .update({
            status: 'rejected',
            requires_review: false,
            reviewer_id: userId,
            updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

    if (error) {
        console.error('Error rejecting post:', error);
        throw new Error('Failed to reject post');
    }

    // Notify creator
    try {
        const channel = getAblyClient().channels.get('notifications');
        await channel.publish('post-status-updated', {
            id: data.id,
            status: 'rejected',
            creator_id: data.creator_id,
            title: 'Post Rejected',
            content: `Your post for ${data.platforms.join(', ')} was rejected.`
        });

        await createNotification(
            data.creator_id,
            'Post Rejected',
            `Your post for ${data.platforms.join(', ')} has been rejected.`,
            'post'
        );
    } catch (err) {
        console.error('Failed to notify creator:', err);
    }

    return data;
}

export async function requestChanges(postId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { data, error } = await supabase
        .from('posts')
        .update({
            status: 'needs_changes',
            requires_review: false, // It's no longer "pending review", it's "pending changes"
            reviewer_id: userId,
            updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

    if (error) {
        console.error('Error requesting changes:', error);
        throw new Error('Failed to request changes');
    }

    // Notify creator
    try {
        const channel = getAblyClient().channels.get('notifications');
        await channel.publish('post-status-updated', {
            id: data.id,
            status: 'needs_changes',
            creator_id: data.creator_id,
            title: 'Changes Requested',
            content: `Revisions requested for your ${data.platforms.join(', ')} post.`
        });

        await createNotification(
            data.creator_id,
            'Changes Requested',
            `A teammate has requested changes on your post for ${data.platforms.join(', ')}.`,
            'post'
        );
    } catch (err) {
        console.error('Failed to notify creator:', err);
    }

    return data;
}

export async function deletePost(postId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

    if (error) {
        console.error('Error deleting post:', error);
        throw new Error('Failed to delete post');
    }

    return { success: true };
}
