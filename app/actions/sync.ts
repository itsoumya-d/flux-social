'use server';

import { createClient } from '@/lib/supabase';
import { createAuthenticatedClient } from '@/lib/supabase-server';
import { auth } from '@clerk/nextjs/server';
import { refreshPlatformToken } from './oauth';

interface SyncResult {
    success: boolean;
    syncedItems: number;
    error?: string;
}

export async function syncBrandData(brandId: string): Promise<SyncResult> {
    const { userId } = await auth();
    if (!userId) {
        return { success: false, syncedItems: 0, error: 'Unauthorized' };
    }

    const supabase = await createAuthenticatedClient();

    // 1. Get connected platforms for the brand
    const { data: platforms, error: platformsError } = await supabase
        .from('platforms')
        .select('*')
        .eq('brand_id', brandId)
        .eq('is_active', true);

    if (platformsError || !platforms) {
        console.error('Error fetching platforms for sync:', platformsError);
        return { success: false, syncedItems: 0, error: 'No connected platforms found' };
    }

    let totalSynced = 0;

    // 3. Sync Platform Data
    for (const platform of platforms) {
        try {
            console.log(`Syncing ${platform.type}...`);

            // Check if token needs refresh
            if (platform.token_expires_at && new Date(platform.token_expires_at) < new Date(Date.now() + 1000 * 60 * 5)) {
                console.log(`Token expired for ${platform.type}, refreshing...`);
                const refreshed = await refreshPlatformToken(platform.id);
                if (!refreshed.success) {
                    console.error(`Failed to refresh token for ${platform.type}`);
                    continue;
                }
            }

            const syncedCount = await performPlatformSync(brandId, platform);
            totalSynced += syncedCount;

            // Update last_synced_at
            await supabase
                .from('platforms')
                .update({ last_synced_at: new Date().toISOString() })
                .eq('id', platform.id);

        } catch (error) {
            console.error(`Sync failed for platform ${platform.type}:`, error);
            // Continue syncing other platforms even if one fails
        }
    }

    return { success: true, syncedItems: totalSynced };
}

import { analyzeSentiment } from './messages';
import { fetchSocialProfileStats, fetchSocialPosts, fetchSocialMentions, SocialPlatform } from '@/lib/social-apis';

async function performPlatformSync(brandId: string, platform: any): Promise<number> {
    const supabase = await createAuthenticatedClient();
    let synced = 0;

    // Use the encrypted access token from the database
    const accessToken = platform.access_token_encrypted || null;

    // 1. Fetch Real Stats
    try {
        const stats = await fetchSocialProfileStats(platform.type as SocialPlatform, accessToken);

        // Only update if we successfully got data (fetchSocialProfileStats returns 0s on soft fail, fails on auth error)
        const { error: analyticsError } = await supabase
            .from('brand_analytics')
            .upsert({
                brand_id: brandId,
                platform: platform.type,
                date: new Date().toISOString().split('T')[0],
                total_reach: stats.reach,
                total_engagement: stats.engagement,
                total_impressions: stats.impressions,
                followers: stats.followers,
            }, { onConflict: 'brand_id, platform, date' });

        if (!analyticsError) synced++;
    } catch (err) {
        console.warn(`Could not fetch stats for ${platform.type}:`, err);
        // Do NOT fall back to mock data.
    }

    // 2. Fetch Real Mentions/Messages
    try {
        const mentions = await fetchSocialMentions(platform.type as SocialPlatform, accessToken);

        for (const mention of mentions) {
            const { error: mentionError } = await supabase
                .from('social_mentions')
                .upsert({
                    brand_id: brandId,
                    platform: platform.type,
                    source_post_id: mention.id,
                    content: mention.content,
                    author_name: mention.author_name,
                    author_handle: mention.author_handle,
                    discovered_at: new Date().toISOString()
                }, { onConflict: 'brand_id, platform, source_post_id' });

            if (!mentionError) synced++;
        }

    } catch (err) {
        console.warn(`Could not fetch mentions for ${platform.type}:`, err);
    }

    // We strictly removed the mock message generation block here.

    return synced;
}
