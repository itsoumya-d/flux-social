'use server';

import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { toast } from 'sonner';

/**
 * Checks if a proactive topup is needed based on AI predictions and user settings.
 * If needed, it performs the topup (simulated payment) and updates the user's credits.
 */
export async function checkAndPerformAutoTopup(postId: string, predictedScore: number) {
    const { userId } = await auth();
    if (!userId) return { success: false, reason: 'Unauthorized' };

    // 1. Fetch user profile and settings
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credits, auto_topup_enabled, auto_topup_threshold, auto_topup_amount, is_pro')
        .eq('id', userId)
        .single();

    if (profileError || !profile) return { success: false, reason: 'Profile not found' };

    // 2. Logic: Should we top up?
    // Criteria: High potential post + low credits + auto-topup enabled + Pro user
    const isHighPotential = predictedScore >= 85;
    const isLowCredits = (profile.credits || 0) <= (profile.auto_topup_threshold || 10);
    const canTopup = profile.auto_topup_enabled && profile.is_pro;

    if (isHighPotential && isLowCredits && canTopup) {
        // 3. Perform Simulated Topup
        // In production, this would trigger a Stripe PaymentIntent using a stored payment method
        const topupAmount = profile.auto_topup_amount || 50;
        const newCredits = (profile.credits || 0) + topupAmount;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', userId);

        if (updateError) return { success: false, reason: 'Failed to update credits' };

        // 4. Log the transaction/audit
        await supabase.from('audit_logs').insert({
            user_id: userId,
            action: 'AUTO_TOPUP',
            entity_type: 'post',
            entity_id: postId,
            details: {
                reason: 'High Potential Post Detected',
                score: predictedScore,
                amount: topupAmount,
                new_balance: newCredits
            }
        });

        revalidatePath('/settings');
        revalidatePath('/composer');

        return {
            success: true,
            topupPerformed: true,
            amount: topupAmount,
            newBalance: newCredits
        };
    }

    return { success: true, topupPerformed: false };
}

/**
 * Updates a user's auto-topup preferences.
 */
export async function updateAutoTopupSettings(settings: {
    enabled: boolean;
    threshold: number;
    amount: number;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('profiles')
        .update({
            auto_topup_enabled: settings.enabled,
            auto_topup_threshold: settings.threshold,
            auto_topup_amount: settings.amount
        })
        .eq('id', userId);

    if (error) throw error;

    revalidatePath('/settings');
    return { success: true };
}
