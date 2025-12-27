'use server';

import { createClient } from '@/lib/supabase';
import { TeamMember, Profile } from '@/lib/types';

export interface TeamMemberWithProfile extends TeamMember {
    profile: Profile;
}

export async function getTeamMembers(brandId: string) {
    const supabase = createClient();

    // In a real app, we would join with the profiles table
    // For this prototype, we will return mock data if no db data exists
    const { data: members, error } = await supabase
        .from('team_members')
        .select(`
            *,
            profile:profiles(*)
        `)
        .eq('brand_id', brandId);

    if (error || !members || members.length === 0) {
        // Return simulated team members
        return [
            {
                id: '1',
                brand_id: brandId,
                user_id: 'user_1',
                role: 'owner',
                profile: {
                    id: 'user_1',
                    full_name: 'Sarah Founder',
                    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
                    email: 'sarah@flux.social'
                }
            },
            {
                id: '2',
                brand_id: brandId,
                user_id: 'user_2',
                role: 'editor',
                profile: {
                    id: 'user_2',
                    full_name: 'Mike Marketing',
                    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
                    email: 'mike@flux.social'
                }
            },
            {
                id: '3',
                brand_id: brandId,
                user_id: 'user_3',
                role: 'viewer',
                profile: {
                    id: 'user_3',
                    full_name: 'Jessica Support',
                    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
                    email: 'jessica@flux.social'
                }
            }
        ] as any[]; // Using any to bypass complex join typing for prototype
    }

    return members as any[];
}

export async function assignMessage(messageId: string, userId: string | null) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('messages')
        .update({ assigned_to: userId })
        .eq('id', messageId)
        .select()
        .single();

    if (error) {
        console.error('Error assigning message:', error);
        return null; // Return null on error
    }

    return data;
}
