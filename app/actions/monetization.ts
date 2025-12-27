'use server';

import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export type CreditCost =
    | 'polish'
    | 'generate_caption'
    | 'generate_image'
    | 'predict_roi';

const COSTS: Record<CreditCost, number> = {
    polish: 1,
    generate_caption: 2,
    generate_image: 5,
    predict_roi: 3
};

export async function hasEnoughCredits(costType: CreditCost): Promise<boolean> {
    const { userId } = await auth();
    if (!userId) return false;

    const { data, error } = await supabase
        .from('profiles')
        .select('credits, is_pro')
        .eq('id', userId)
        .single();

    if (error || !data) return false;

    // Pro users have unlimited credits in this model, or we can still track them
    if (data.is_pro) return true;

    return (data.credits || 0) >= COSTS[costType];
}

export async function deductCredits(costType: CreditCost) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const cost = COSTS[costType];

    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('credits, is_pro')
        .eq('id', userId)
        .single();

    if (fetchError || !profile) throw new Error('Could not verify credits');

    if (profile.is_pro) return { success: true, remaining: -1 };

    if (profile.credits < cost) {
        throw new Error('Insufficient credits. Upgrade to Pro for unlimited generation.');
    }

    const { data, error } = await supabase
        .from('profiles')
        .update({
            credits: profile.credits - cost,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('credits')
        .single();

    if (error) {
        console.error('Credit deduction error:', error);
        throw new Error('Failed to process credits');
    }

    return { success: true, remaining: data.credits };
}

export async function getCreditBalance() {
    const { userId } = await auth();
    if (!userId) return 0;

    const { data, error } = await supabase
        .from('profiles')
        .select('credits, is_pro')
        .eq('id', userId)
        .single();

    if (error || !data) return 0;
    return data.is_pro ? 999999 : data.credits;
}
