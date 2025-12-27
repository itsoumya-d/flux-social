import { TwitterService } from './platforms/twitter';
import { LinkedInService } from './platforms/linkedin';

export type SocialPlatform = 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'tiktok';

export interface SocialMetrics {
    reach: number;
    engagement: number;
    impressions: number;
    followers: number;
}

export interface SocialContent {
    id: string;
    content: string;
    publishedAt: string;
    metrics: {
        likes: number;
        shares: number;
        comments: number;
    };
}

/**
 * Standardized Social API Client
 * This module should handle actual API calls to social platforms.
 * 
 * IMPORTANT: This replaces previous mock data generators. 
 * If API keys are missing or requests fail, it throws errors 
 * so the UI can handle "No Connection" states appropriately 
 * instead of showing fake numbers.
 */

export async function fetchSocialProfileStats(platform: SocialPlatform, accessToken: string): Promise<SocialMetrics> {
    console.log(`[RealAPI] Fetching stats for ${platform}...`);

    if (!accessToken || accessToken === 'mock-token') {
        throw new Error('Valid Access Token Required for Real Data');
    }

    if (platform === 'twitter') {
        const twitter = new TwitterService(accessToken);
        const stats = await twitter.getProfileStats();
        return twitter.calculateAggregatedMetrics(stats);
    }

    if (platform === 'linkedin') {
        const linkedin = new LinkedInService(accessToken);
        const stats = await linkedin.getFollowerCount();
        const profile = await linkedin.getProfile();
        return linkedin.calculateAggregatedMetrics(profile, stats);
    }

    // Attempting real fetch (placeholder for SDK call)
    // If we can't fetch real data, we return 0s, NOT fake data.
    return {
        reach: 0,
        engagement: 0,
        impressions: 0,
        followers: 0
    };
}

export async function fetchSocialPosts(platform: SocialPlatform, accessToken: string, limit = 10): Promise<SocialContent[]> {
    console.log(`[RealAPI] Fetching posts for ${platform}...`);

    if (!accessToken || accessToken === 'mock-token') {
        throw new Error('Valid Access Token Required for Real Data');
    }

    if (platform === 'twitter') {
        const twitter = new TwitterService(accessToken);
        return await twitter.getRecentContent(limit);
    }

    if (platform === 'linkedin') {
        const linkedin = new LinkedInService(accessToken);
        return await linkedin.getRecentContent(limit);
    }

    // Return empty array if real fetch fails/isn't implemented yet.
    // DO NOT return mock posts "Loving Flux!".
    return [];
}

export async function fetchSocialMentions(platform: SocialPlatform, accessToken: string): Promise<any[]> {
    console.log(`[RealAPI] Fetching mentions for ${platform}...`);

    if (!accessToken || accessToken === 'mock-token') {
        throw new Error('Valid Access Token Required for Real Data');
    }

    if (platform === 'twitter') {
        const twitter = new TwitterService(accessToken);
        return await twitter.getMentions();
    }

    if (platform === 'linkedin') {
        const linkedin = new LinkedInService(accessToken);
        return await linkedin.getMentions();
    }

    return [];
}
