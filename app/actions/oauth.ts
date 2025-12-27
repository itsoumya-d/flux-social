'use server';

import { createClient } from '@/lib/supabase';
import type { PlatformType } from '@/lib/types';
import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'crypto';

// Platform OAuth configuration
const PLATFORM_CONFIG: Record<PlatformType, {
    authUrl: string;
    tokenUrl: string;
    scopes: string[];
    clientIdEnv: string;
    clientSecretEnv: string;
}> = {
    twitter: {
        authUrl: 'https://twitter.com/i/oauth2/authorize',
        tokenUrl: 'https://api.twitter.com/2/oauth2/token',
        scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
        clientIdEnv: 'TWITTER_CLIENT_ID',
        clientSecretEnv: 'TWITTER_CLIENT_SECRET',
    },
    instagram: {
        authUrl: 'https://api.instagram.com/oauth/authorize',
        tokenUrl: 'https://api.instagram.com/oauth/access_token',
        scopes: ['user_profile', 'user_media'],
        clientIdEnv: 'INSTAGRAM_CLIENT_ID',
        clientSecretEnv: 'INSTAGRAM_CLIENT_SECRET',
    },
    linkedin: {
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        scopes: ['openid', 'profile', 'email', 'w_member_social'],
        clientIdEnv: 'LINKEDIN_CLIENT_ID',
        clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
    },
    facebook: {
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
        scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
        clientIdEnv: 'FACEBOOK_CLIENT_ID',
        clientSecretEnv: 'FACEBOOK_CLIENT_SECRET',
    },
    tiktok: {
        authUrl: 'https://www.tiktok.com/auth/authorize/',
        tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
        scopes: ['user.info.basic', 'video.list', 'video.upload'],
        clientIdEnv: 'TIKTOK_CLIENT_ID',
        clientSecretEnv: 'TIKTOK_CLIENT_SECRET',
    },
    pinterest: {
        authUrl: 'https://api.pinterest.com/oauth/',
        tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
        scopes: ['boards:read', 'pins:read', 'pins:write'],
        clientIdEnv: 'PINTEREST_CLIENT_ID',
        clientSecretEnv: 'PINTEREST_CLIENT_SECRET',
    },
    youtube: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
        clientIdEnv: 'GOOGLE_CLIENT_ID',
        clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    },
    threads: {
        authUrl: 'https://www.threads.net/oauth/authorize',
        tokenUrl: 'https://graph.threads.net/oauth/access_token',
        scopes: ['threads_basic', 'threads_content_publish'],
        clientIdEnv: 'THREADS_CLIENT_ID',
        clientSecretEnv: 'THREADS_CLIENT_SECRET',
    },
    bluesky: {
        authUrl: '', // Bluesky uses app passwords, not OAuth
        tokenUrl: '',
        scopes: [],
        clientIdEnv: '',
        clientSecretEnv: '',
    },
    google_business: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/business.manage'],
        clientIdEnv: 'GOOGLE_CLIENT_ID',
        clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    },
};

// PKCE Helpers
function generateCodeVerifier(): string {
    return randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
    return createHash('sha256').update(verifier).digest('base64url');
}

// Generate OAuth authorization URL
export async function getOAuthUrl(
    platform: PlatformType,
    brandId: string,
    redirectUri: string
): Promise<{ url: string | null; error: string | null }> {
    const config = PLATFORM_CONFIG[platform];

    if (!config.authUrl) {
        return { url: null, error: `${platform} does not support OAuth` };
    }

    const clientId = process.env[config.clientIdEnv];
    if (!clientId) {
        return { url: null, error: `${platform} client ID not configured` };
    }

    // Create state token for security (includes brandId for callback)
    const state = Buffer.from(JSON.stringify({ brandId, platform, ts: Date.now() })).toString('base64');

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: config.scopes.join(' '),
        state,
    });

    // Platform-specific parameters
    if (platform === 'twitter') {
        const verifier = generateCodeVerifier();
        const challenge = generateCodeChallenge(verifier);

        params.set('code_challenge', challenge);
        params.set('code_challenge_method', 'S256');

        // Store verifier in a secure cookie for the callback
        (await cookies()).set(`twitter_oauth_verifier_${state}`, verifier, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 10, // 10 minutes
            path: '/'
        });
    }

    const url = `${config.authUrl}?${params.toString()}`;
    return { url, error: null };
}

// Exchange authorization code for access token
export async function exchangeOAuthCode(
    platform: PlatformType,
    code: string,
    redirectUri: string,
    state: string
): Promise<{ success: boolean; platformId?: string; error?: string }> {
    const supabase = createClient();
    const config = PLATFORM_CONFIG[platform];

    // Decode state to get brandId
    let stateData: { brandId: string; platform: string };
    try {
        stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
        return { success: false, error: 'Invalid state parameter' };
    }

    const clientId = process.env[config.clientIdEnv];
    const clientSecret = process.env[config.clientSecretEnv];

    if (!clientId || !clientSecret) {
        return { success: false, error: 'OAuth credentials not configured' };
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                ...(clientSecret && { client_secret: clientSecret }),
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                ...(platform === 'twitter' && {
                    code_verifier: (await cookies()).get(`twitter_oauth_verifier_${state}`)?.value || ''
                })
            }),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('Token exchange failed:', error);
            return { success: false, error: 'Failed to exchange authorization code' };
        }

        const tokens = await tokenResponse.json();

        // Get user profile from platform
        const profile = await fetchPlatformProfile(platform, tokens.access_token);

        // Store platform connection
        const { data, error } = await supabase
            .from('platforms')
            .insert({
                brand_id: stateData.brandId,
                type: platform,
                profile_id: profile.id,
                profile_name: profile.name,
                profile_avatar: profile.avatar,
                access_token_encrypted: tokens.access_token, // In production, encrypt this
                refresh_token_encrypted: tokens.refresh_token,
                token_expires_at: tokens.expires_in
                    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
                    : null,
                is_active: true,
                last_synced_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Error storing platform:', error);
            return { success: false, error: 'Failed to save platform connection' };
        }

        return { success: true, platformId: data.id };
    } catch (error) {
        console.error('OAuth exchange error:', error);
        return { success: false, error: 'OAuth exchange failed' };
    }
}

// Fetch user profile from connected platform
async function fetchPlatformProfile(
    platform: PlatformType,
    accessToken: string
): Promise<{ id: string; name: string; avatar: string | null }> {
    const endpoints: Partial<Record<PlatformType, string>> = {
        twitter: 'https://api.twitter.com/2/users/me?user.fields=profile_image_url',
        instagram: 'https://graph.instagram.com/me?fields=id,username,profile_picture_url',
        linkedin: 'https://api.linkedin.com/v2/userinfo',
        facebook: 'https://graph.facebook.com/me?fields=id,name,picture',
        tiktok: 'https://open-api.tiktok.com/user/info/',
        youtube: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    };

    const endpoint = endpoints[platform];
    if (!endpoint) {
        return { id: 'unknown', name: platform, avatar: null };
    }

    try {
        const response = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            return { id: 'unknown', name: platform, avatar: null };
        }

        const data = await response.json();

        // Parse response based on platform
        switch (platform) {
            case 'twitter':
                return {
                    id: data.data?.id || 'unknown',
                    name: data.data?.username || platform,
                    avatar: data.data?.profile_image_url || null,
                };
            case 'instagram':
                return {
                    id: data.id || 'unknown',
                    name: data.username || platform,
                    avatar: data.profile_picture_url || null,
                };
            case 'linkedin':
                return {
                    id: data.sub || 'unknown',
                    name: data.name || `${data.given_name} ${data.family_name}`,
                    avatar: data.picture || null,
                };
            case 'facebook':
                return {
                    id: data.id || 'unknown',
                    name: data.name || platform,
                    avatar: data.picture?.data?.url || null,
                };
            case 'youtube':
                const channel = data.items?.[0];
                return {
                    id: channel?.id || 'unknown',
                    name: channel?.snippet?.title || platform,
                    avatar: channel?.snippet?.thumbnails?.default?.url || null,
                };
            default:
                return { id: 'unknown', name: platform, avatar: null };
        }
    } catch {
        return { id: 'unknown', name: platform, avatar: null };
    }
}

// Get all connected platforms for a brand
export async function getConnectedPlatforms(brandId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('brand_id', brandId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching platforms:', error);
        return { platforms: [], error: error.message };
    }

    return { platforms: data, error: null };
}

// Disconnect a platform
export async function disconnectPlatform(platformId: string) {
    const supabase = createClient();

    const { error } = await supabase
        .from('platforms')
        .update({ is_active: false })
        .eq('id', platformId);

    if (error) {
        console.error('Error disconnecting platform:', error);
        return { success: false, error: error.message };
    }

    return { success: true, error: null };
}

// Refresh platform access token
export async function refreshPlatformToken(platformId: string) {
    const supabase = createClient();

    // Get current platform data
    const { data: platform, error: fetchError } = await supabase
        .from('platforms')
        .select('*')
        .eq('id', platformId)
        .single();

    if (fetchError || !platform) {
        return { success: false, error: 'Platform not found' };
    }

    const config = PLATFORM_CONFIG[platform.type as PlatformType];
    const clientId = process.env[config.clientIdEnv];
    const clientSecret = process.env[config.clientSecretEnv];

    if (!clientId || !clientSecret || !platform.refresh_token_encrypted) {
        return { success: false, error: 'Cannot refresh token' };
    }

    try {
        const response = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: platform.refresh_token_encrypted,
                grant_type: 'refresh_token',
            }),
        });

        if (!response.ok) {
            return { success: false, error: 'Token refresh failed' };
        }

        const tokens = await response.json();

        // Update stored tokens
        const { error: updateError } = await supabase
            .from('platforms')
            .update({
                access_token_encrypted: tokens.access_token,
                refresh_token_encrypted: tokens.refresh_token || platform.refresh_token_encrypted,
                token_expires_at: tokens.expires_in
                    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
                    : null,
                last_synced_at: new Date().toISOString(),
            })
            .eq('id', platformId);

        if (updateError) {
            return { success: false, error: 'Failed to save new tokens' };
        }

        return { success: true, error: null };
    } catch {
        return { success: false, error: 'Token refresh failed' };
    }
}
