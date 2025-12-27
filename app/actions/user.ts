'use server';

import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function getUserProfile() {
    const { userId } = await auth();
    if (!userId) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }

    return data;
}

export async function updateProfile(data: any) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('profiles')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (error) throw error;

    revalidatePath('/settings');
    return { success: true };
}
