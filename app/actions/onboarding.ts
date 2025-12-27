'use server';

import { createAuthenticatedClient } from '@/lib/supabase-server';
import { currentUser } from '@clerk/nextjs/server';

export async function saveOnboardingData(data: {
    persona?: 'casual' | 'professional' | 'hype';
    step?: number;
    hasCompletedOnboarding?: boolean;
}) {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const supabase = await createAuthenticatedClient();

    try {
        // First, check if user exists in our users table, if not replicate from Clerk
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();

        if (!existingUser) {
            // Create user record if missing
            await supabase.from('users').insert({
                id: user.id,
                email: user.emailAddresses[0]?.emailAddress,
                full_name: user.firstName + ' ' + user.lastName,
                avatar_url: user.imageUrl,
                onboarding_step: data.step || 1,
                brand_voice_persona: data.persona
            });
        } else {
            // Update existing
            await supabase
                .from('users')
                .update({
                    ...(data.persona && { brand_voice_persona: data.persona }),
                    ...(data.step && { onboarding_step: data.step }),
                    ...(data.hasCompletedOnboarding !== undefined && { has_completed_onboarding: data.hasCompletedOnboarding }),
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
        }

        return { success: true };
    } catch (error) {
        console.error('Error saving onboarding data:', error);
        return { success: false, error: 'Failed to save data' };
    }
}
