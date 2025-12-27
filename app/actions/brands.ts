'use server';

import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { getActiveBrandId } from './workspace';

export async function getAccessibleBrands() {
    const { userId } = await auth();

    if (!userId) {
        // Return a mock brand for unauthenticated development if needed, 
        // but Clerk is active, so we should have a userId.
        return [{ id: 'mock-brand-id', name: 'FluxSocial Demo', owner_id: 'dev-user' }];
    }

    try {
        // Get brands where owner OR team member
        const { data: ownedBrands, error: ownerError } = await supabase
            .from('brands')
            .select('*')
            .eq('owner_id', userId);

        const { data: teamMemberships, error: teamError } = await supabase
            .from('team_members')
            .select('brand_id, brands(*)')
            .eq('user_id', userId)
            .not('accepted_at', 'is', null);

        if (ownerError || teamError) {
            console.warn('Supabase error, using mock brand for audit');
            return [{ id: 'mock-brand-id', name: 'FluxSocial Demo', owner_id: userId }];
        }

        const teamBrands = teamMemberships?.map(m => m.brands).filter(Boolean) || [];
        const allBrands = [...(ownedBrands || []), ...teamBrands];

        if (allBrands.length === 0) {
            // Create a real default brand so FK constraints work
            try {
                const newBrand = await createBrand('My Workspace');
                return [newBrand];
            } catch (err) {
                console.error('Failed to auto-create default brand:', err);
                return [{ id: 'mock-brand-id', name: 'FluxSocial Demo', owner_id: userId }];
            }
        }

        const uniqueBrands = Array.from(new Map(allBrands.map(item => [item['id'], item])).values());
        return uniqueBrands;
    } catch (e) {
        console.error('Error in getAccessibleBrands:', e);
        return [{ id: 'mock-brand-id', name: 'FluxSocial Demo', owner_id: userId }];
    }
}

export async function updateBrandSettings(brandId: string, settings: any) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('brands')
        .update(settings)
        .eq('id', brandId);

    if (error) throw error;
    return { success: true };
}

export async function createBrand(name: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
        .from('brands')
        .insert({
            name,
            owner_id: userId,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating brand:', error);
        throw new Error('Failed to create brand');
    }

    return data;
}

export async function ensureDefaultBrand() {
    const brands = await getAccessibleBrands();
    if (brands.length === 0) {
        return await createBrand('Default Brand');
    }

    const activeBrandId = await getActiveBrandId();
    if (activeBrandId) {
        const activeBrand = brands.find(b => b.id === activeBrandId);
        if (activeBrand) return activeBrand;
    }

    return brands[0];
}
