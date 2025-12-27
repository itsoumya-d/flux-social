'use server';

import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function getNotifications() {
    const { userId } = await auth();
    if (!userId) return [];

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return data;
}

export async function markAsRead(notificationId: string) {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) throw error;
}

export async function createNotification(userId: string, title: string, content: string, type: string) {
    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            title,
            content,
            type
        });

    if (error) {
        console.error('Error creating notification:', error);
    }
}
