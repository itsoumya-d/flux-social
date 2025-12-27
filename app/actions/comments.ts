'use server';

import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { createNotification } from './notifications';
import * as Ably from 'ably';

const ably = new Ably.Rest({ key: process.env.NEXT_PUBLIC_ABLY_API_KEY });

export async function addComment(postId: string, content: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { data, error } = await supabase
        .from('post_comments')
        .insert({
            post_id: postId,
            user_id: userId,
            content
        })
        .select(`
            *,
            profile:profiles(full_name, avatar_url)
        `)
        .single();

    if (error) {
        console.error('Error adding comment:', error);
        throw new Error('Failed to add comment');
    }

    // Get post creator to notify them
    const { data: post } = await supabase
        .from('posts')
        .select('creator_id, platforms')
        .eq('id', postId)
        .single();

    if (post && post.creator_id !== userId) {
        try {
            const channel = ably.channels.get('notifications');
            await channel.publish('new-feedback', {
                postId,
                creator_id: post.creator_id,
                title: 'New Feedback Recieved',
                content: `A teammate left feedback on your ${post.platforms.join(', ')} draft.`
            });
        } catch (err) {
            console.error('Ably notification failed:', err);
        }

        await createNotification(
            post.creator_id,
            'New Feedback Recieved',
            `A teammate left feedback on your ${post.platforms.join(', ')} draft.`,
            'post'
        );
    }

    return data;
}

export async function getComments(postId: string) {
    const { data, error } = await supabase
        .from('post_comments')
        .select(`
            *,
            profile:profiles(full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching comments:', error);
        return [];
    }

    return data;
}

export async function updateComment(commentId: string, content: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { data, error } = await supabase
        .from('post_comments')
        .update({ content })
        .eq('id', commentId)
        .eq('user_id', userId) // Security: only owner can edit
        .select()
        .single();

    if (error) {
        console.error('Error updating comment:', error);
        throw new Error('Failed to update comment');
    }

    return data;
}

export async function deleteComment(commentId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId); // Security: only owner can delete

    if (error) {
        console.error('Error deleting comment:', error);
        throw new Error('Failed to delete comment');
    }

    return true;
}

export async function resolveComment(commentId: string, isResolved: boolean = true) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { data, error } = await supabase
        .from('post_comments')
        .update({ is_resolved: isResolved })
        .eq('id', commentId)
        .select()
        .single();

    if (error) {
        console.error('Error resolving comment:', error);
        throw new Error('Failed to resolve comment');
    }

    return data;
}
