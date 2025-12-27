'use server';

import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function inviteTeamMember(brandId: string, email: string, role: string) {
    const { userId: inviterId } = await auth();
    if (!inviterId) throw new Error('Unauthorized');

    // 1. Find profile by email
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

    if (!profile) {
        throw new Error('User not found. They must sign up for FluxSocial first.');
    }

    // 2. Create membership
    const { error } = await supabase
        .from('team_members')
        .insert({
            brand_id: brandId,
            user_id: profile.id,
            role,
            invited_by: inviterId,
            invited_at: new Date().toISOString()
        });

    if (error) {
        if (error.code === '23505') throw new Error('User is already a team member.');
        throw error;
    }

    return { success: true };
}

export async function updateMemberRole(memberId: string, role: string) {
    const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId);

    if (error) throw error;
    return { success: true };
}

export async function removeMember(memberId: string) {
    const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

    if (error) throw error;
    return { success: true };
}
