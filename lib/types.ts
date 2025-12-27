// FluxSocial Database Types
// Auto-generated from Supabase schema

export type BillingTier = 'free' | 'creator' | 'team' | 'agency' | 'enterprise';
export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type PlatformType = 'twitter' | 'instagram' | 'linkedin' | 'facebook' | 'tiktok' | 'pinterest' | 'youtube' | 'threads' | 'bluesky' | 'google_business';
export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'pending_review' | 'rejected';
export type Sentiment = 'positive' | 'negative' | 'neutral' | 'mixed';
export type MessageType = 'comment' | 'dm' | 'mention' | 'reply';
export type NotificationType = 'post_published' | 'post_failed' | 'approval_needed' | 'mention' | 'comment' | 'team_invite' | 'crisis_alert' | 'milestone';
export type FileType = 'image' | 'video' | 'gif' | 'document';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    billing_tier: BillingTier;
    onboarding_completed: boolean;
    preferences: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface Brand {
    id: string;
    name: string;
    owner_id: string;
    logo_url: string | null;
    timezone: string;
    industry: string | null;
    website_url: string | null;
    created_at: string;
}

export interface TeamMember {
    id: string;
    brand_id: string;
    user_id: string;
    role: TeamRole;
    invited_by: string | null;
    invited_at: string;
    accepted_at: string | null;
}

export interface Platform {
    id: string;
    brand_id: string;
    type: PlatformType;
    profile_id: string | null;
    profile_name: string | null;
    profile_avatar: string | null;
    access_token_encrypted: string | null;
    refresh_token_encrypted: string | null;
    token_expires_at: string | null;
    api_key_ref: string | null;
    is_active: boolean;
    last_synced_at: string | null;
    created_at: string;
}

export interface BrandVoice {
    id: string;
    brand_id: string;
    name: string;
    tone_formality: number;
    tone_enthusiasm: number;
    tone_humor: number;
    tone_technicality: number;
    key_phrases: string[];
    avoid_phrases: string[];
    style_examples: ContentExample[];
    embedding_vector: number[] | null;
    created_at: string;
    updated_at: string;
}

export interface ContentExample {
    content: string;
    platform: PlatformType;
    performance_score?: number;
}

export interface Post {
    id: string;
    brand_id: string;
    creator_id: string | null;
    content: string;
    platform_specific_content: Record<PlatformType, string>;
    media_urls: string[];
    platforms: string[];
    hashtags: string[];
    status: PostStatus;
    scheduled_at: string | null;
    published_at: string | null;
    optimal_time_suggested: string | null;
    requires_review: boolean;
    reviewer_id: string | null;
    reviewed_at: string | null;
    review_notes: string | null;
    ai_generated: boolean;
    brand_voice_id: string | null;
    predicted_engagement: PredictedEngagement | null;
    created_at: string;
    updated_at: string;
}

export interface PredictedEngagement {
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    confidence: number;
}

export interface PostResult {
    id: string;
    post_id: string;
    platform_id: string;
    platform_post_id: string | null;
    published_at: string | null;
    error_message: string | null;
    created_at: string;
}

export interface Analytics {
    id: string;
    post_id: string;
    platform: PlatformType;
    metrics: EngagementMetrics;
    audience_demographics: AudienceDemographics | null;
    engagement_rate: number | null;
    captured_at: string;
}

export interface EngagementMetrics {
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    video_views?: number;
    watch_time_seconds?: number;
}

export interface AudienceDemographics {
    age_groups: Record<string, number>;
    gender: Record<string, number>;
    locations: Record<string, number>;
}

export interface BrandAnalytics {
    id: string;
    brand_id: string;
    platform: PlatformType;
    date: string;
    followers: number | null;
    followers_gained: number | null;
    followers_lost: number | null;
    total_impressions: number | null;
    total_reach: number | null;
    total_engagement: number | null;
    engagement_rate: number | null;
    top_post_id: string | null;
    created_at: string;
}

export interface SocialMention {
    id: string;
    brand_id: string;
    platform: PlatformType;
    source_url: string | null;
    source_post_id: string | null;
    author_name: string | null;
    author_handle: string | null;
    author_avatar: string | null;
    author_followers: number | null;
    content: string;
    sentiment: Sentiment;
    sentiment_score: number | null;
    is_influencer: boolean;
    reach_estimate: number | null;
    engagement_count: number | null;
    requires_response: boolean;
    responded_at: string | null;
    response_post_id: string | null;
    keywords_matched: string[];
    discovered_at: string;
}

export interface Competitor {
    id: string;
    brand_id: string;
    name: string;
    handles: Record<PlatformType, string>;
    website_url: string | null;
    notes: string | null;
    created_at: string;
}

export interface CompetitorAnalytics {
    id: string;
    competitor_id: string;
    platform: PlatformType;
    date: string;
    followers: number | null;
    followers_change: number | null;
    posts_count: number | null;
    avg_engagement_rate: number | null;
    top_performing_content: TopContent[] | null;
    captured_at: string;
}

export interface TopContent {
    content: string;
    engagement: number;
    url: string;
}

export interface HashtagAnalytics {
    id: string;
    brand_id: string;
    hashtag: string;
    platform: PlatformType;
    times_used: number;
    avg_reach: number | null;
    avg_engagement_rate: number | null;
    trending_score: number | null;
    last_used_at: string | null;
    created_at: string;
}

export interface Message {
    id: string;
    brand_id: string;
    platform: PlatformType;
    platform_message_id: string | null;
    thread_id: string | null;
    sender_id: string | null;
    sender_name: string;
    sender_handle: string | null;
    sender_avatar: string | null;
    sender_followers: number | null;
    content: string;
    message_type: MessageType;
    sentiment: Sentiment;
    sentiment_score: number | null;
    priority_score: number;
    ai_suggested_response: string | null;
    is_important: boolean;
    is_read: boolean;
    is_archived: boolean;
    assigned_to: string | null;
    responded_at: string | null;
    response_content: string | null;
    parent_post_id: string | null;
    created_at: string;
}

export interface ScheduledJob {
    id: string;
    post_id: string;
    scheduled_for: string;
    status: JobStatus;
    attempts: number;
    last_error: string | null;
    executed_at: string | null;
    created_at: string;
}

export interface Notification {
    id: string;
    user_id: string;
    brand_id: string | null;
    title: string;
    content: string;
    type: NotificationType;
    action_url: string | null;
    metadata: Record<string, unknown>;
    is_read: boolean;
    created_at: string;
}

export interface PostComment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    mentioned_users: string[];
    is_resolved: boolean;
    resolved_by: string | null;
    resolved_at: string | null;
    created_at: string;
}

export interface ContentLibraryItem {
    id: string;
    brand_id: string;
    uploaded_by: string | null;
    file_url: string;
    file_type: FileType;
    file_name: string | null;
    file_size: number | null;
    width: number | null;
    height: number | null;
    duration_seconds: number | null;
    alt_text: string | null;
    tags: string[];
    used_count: number;
    created_at: string;
}

export interface AuditLog {
    id: string;
    brand_id: string | null;
    user_id: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

// Platform configuration for UI
export const PLATFORMS: Record<PlatformType, { label: string; color: string; icon: string }> = {
    twitter: { label: 'X/Twitter', color: '#1DA1F2', icon: 'Twitter' },
    instagram: { label: 'Instagram', color: '#E1306C', icon: 'Instagram' },
    linkedin: { label: 'LinkedIn', color: '#0A66C2', icon: 'Linkedin' },
    facebook: { label: 'Facebook', color: '#1877F2', icon: 'Facebook' },
    tiktok: { label: 'TikTok', color: '#000000', icon: 'TikTok' },
    pinterest: { label: 'Pinterest', color: '#E60023', icon: 'Pinterest' },
    youtube: { label: 'YouTube', color: '#FF0000', icon: 'Youtube' },
    threads: { label: 'Threads', color: '#000000', icon: 'AtSign' },
    bluesky: { label: 'Bluesky', color: '#0085FF', icon: 'Cloud' },
    google_business: { label: 'Google Business', color: '#4285F4', icon: 'MapPin' },
};

// Billing tier limits
export const TIER_LIMITS: Record<BillingTier, { channels: number; users: number; posts_per_month: number }> = {
    free: { channels: 3, users: 1, posts_per_month: 30 },
    creator: { channels: 10, users: 3, posts_per_month: 300 },
    team: { channels: 25, users: 10, posts_per_month: 1000 },
    agency: { channels: 50, users: -1, posts_per_month: -1 }, // -1 = unlimited
    enterprise: { channels: -1, users: -1, posts_per_month: -1 },
};
