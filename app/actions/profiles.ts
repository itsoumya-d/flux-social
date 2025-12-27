'use server';

import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function getAllProfiles() {
    const { userId } = await auth();

    if (!userId) {
        return [];
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching profiles:', error);
        return [];
    }

    return data;
}
export async function getUserRole(brandId: string) {
    const { userId } = await auth();
    if (!userId) return 'viewer';

    // 1. Check if owner
    const { data: brand } = await supabase
        .from('brands')
        .select('owner_id')
        .eq('id', brandId)
        .single();

    if (brand?.owner_id === userId) return 'owner';

    // 2. Check team_members role
    const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('brand_id', brandId)
        .eq('user_id', userId)
        .single();

    return membership?.role || 'viewer';
}

export async function getBrandTeam(brandId: string) {
    const { data: members, error } = await supabase
        .from('team_members')
        .select(`
            id,
            role,
            status:accepted_at,
            profiles:user_id (id, full_name, email, avatar_url)
        `)
        .eq('brand_id', brandId);

    if (error) return [];

    return members.map((m: any) => ({
        id: m.id,
        name: m.profiles.full_name || 'Flux User',
        email: m.profiles.email,
        image: m.profiles.avatar_url,
        role: m.role,
        status: m.status ? 'Active' : 'Pending'
    }));
}

export async function getCurrentProfile() {
    const { userId } = await auth();
    if (!userId) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return data;
}
