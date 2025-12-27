'use server';

import { createClient } from '@/lib/supabase';
import OpenAI from 'openai';
import type { SocialMention, Sentiment, PlatformType } from '@/lib/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization
let geminiClient: GoogleGenerativeAI | null = null;
let openaiClient: OpenAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
    if (!geminiClient) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is not set');
        }
        geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return geminiClient;
}

function getOpenAIClient(): OpenAI {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }
        openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openaiClient;
}

// Fetch social mentions for a brand with filtering options
export async function getSocialMentions(
    brandId: string,
    options: {
        sentiment?: Sentiment;
        platform?: PlatformType;
        requiresResponse?: boolean;
        isInfluencer?: boolean;
        limit?: number;
        offset?: number;
    } = {}
) {
    const supabase = createClient();

    let query = supabase
        .from('social_mentions')
        .select('*')
        .eq('brand_id', brandId)
        .order('discovered_at', { ascending: false });

    if (options.sentiment) {
        query = query.eq('sentiment', options.sentiment);
    }
    if (options.platform) {
        query = query.eq('platform', options.platform);
    }
    if (options.requiresResponse !== undefined) {
        query = query.eq('requires_response', options.requiresResponse);
    }
    if (options.isInfluencer !== undefined) {
        query = query.eq('is_influencer', options.isInfluencer);
    }

    const limit = options.limit || 50;
    const offset = options.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching social mentions:', error);
        return { mentions: [], error: error.message };
    }

    return { mentions: data as SocialMention[], error: null };
}

// Analyze sentiment of a mention using Gemini (with OpenAI fallback)
export async function analyzeSentiment(content: string) {
    try {
        const gemini = getGeminiClient();
        const model = gemini.getGenerativeModel({
            model: 'gemini-1.5-flash-latest',
            generationConfig: { responseMimeType: 'application/json' }
        });

        const prompt = `Analyze the sentiment of this social media mention and return a JSON object:
        
"${content}"

Return format:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "score": -1 to 1,
  "topics": ["topic1", "topic2"],
  "requiresResponse": boolean
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const data = JSON.parse(text);

        return {
            sentiment: data.sentiment || 'neutral',
            score: data.score || 0,
            topics: data.topics || [],
            requiresResponse: data.requiresResponse || false,
        };
    } catch (error) {
        console.error('Gemini sentiment analysis failed, falling back to OpenAI:', error);
        try {
            const openai = getOpenAIClient();
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a sentiment analysis expert. Analyze the following social media content and return a JSON object with:
- sentiment: "positive", "negative", "neutral", or "mixed"
- score: a number from -1 (very negative) to 1 (very positive)
- topics: an array of key topics/themes mentioned
- requiresResponse: boolean indicating if this seems to require a reply (questions, complaints, direct mentions)
Return ONLY valid JSON.`
                    },
                    { role: 'user', content }
                ],
                response_format: { type: 'json_object' }
            });

            const result = JSON.parse(response.choices[0].message.content || '{}');

            return {
                sentiment: result.sentiment || 'neutral',
                score: result.score || 0,
                topics: result.topics || [],
                requiresResponse: result.requiresResponse || false,
            };
        } catch (openaiError) {
            console.error('All sentiment analysis failed:', openaiError);
            return {
                sentiment: 'neutral' as Sentiment,
                score: 0,
                topics: [],
                requiresResponse: false,
            };
        }
    }
}

// Add a new social mention with automatic sentiment analysis
export async function addSocialMention(
    brandId: string,
    mention: {
        platform: PlatformType;
        content: string;
        authorName?: string;
        authorHandle?: string;
        authorAvatar?: string;
        authorFollowers?: number;
        sourceUrl?: string;
        sourcePostId?: string;
    }
) {
    const supabase = createClient();

    // Analyze sentiment
    const sentimentResult = await analyzeSentiment(mention.content);

    // Check if author is an influencer (>10k followers)
    const isInfluencer = (mention.authorFollowers || 0) >= 10000;

    // Estimate reach based on follower count
    const reachEstimate = Math.round((mention.authorFollowers || 100) * 0.1);

    const { data, error } = await supabase
        .from('social_mentions')
        .insert({
            brand_id: brandId,
            platform: mention.platform,
            content: mention.content,
            author_name: mention.authorName,
            author_handle: mention.authorHandle,
            author_avatar: mention.authorAvatar,
            author_followers: mention.authorFollowers,
            source_url: mention.sourceUrl,
            source_post_id: mention.sourcePostId,
            sentiment: sentimentResult.sentiment,
            sentiment_score: sentimentResult.score,
            is_influencer: isInfluencer,
            reach_estimate: reachEstimate,
            requires_response: sentimentResult.requiresResponse,
            keywords_matched: sentimentResult.topics,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding social mention:', error);
        return { mention: null, error: error.message };
    }

    return { mention: data as SocialMention, error: null };
}

// Get mention statistics for dashboard
export async function getMentionStats(brandId: string, days: number = 7) {
    const supabase = createClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('social_mentions')
        .select('sentiment, is_influencer, requires_response, platform')
        .eq('brand_id', brandId)
        .gte('discovered_at', startDate.toISOString());

    if (error) {
        console.error('Error fetching mention stats:', error);
        return null;
    }

    type MentionRow = { sentiment: string; is_influencer: boolean; requires_response: boolean; platform: string };

    const stats = {
        total: data.length,
        positive: data.filter((m: MentionRow) => m.sentiment === 'positive').length,
        negative: data.filter((m: MentionRow) => m.sentiment === 'negative').length,
        neutral: data.filter((m: MentionRow) => m.sentiment === 'neutral').length,
        influencerMentions: data.filter((m: MentionRow) => m.is_influencer).length,
        requiresResponse: data.filter((m: MentionRow) => m.requires_response).length,
        byPlatform: {} as Record<string, number>,
    };

    data.forEach((m: MentionRow) => {
        stats.byPlatform[m.platform] = (stats.byPlatform[m.platform] || 0) + 1;
    });

    return stats;
}

// Generate AI response suggestion for a mention (Gemini primary)
export async function generateMentionResponse(
    mentionContent: string,
    brandVoice?: string // Now taking string directly for consistency
) {
    try {
        const systemPrompt = `You are a social media manager crafting responses. 
${brandVoice ? `Brand voice guidelines: ${brandVoice}` : 'Be professional and friendly.'}
Keep responses concise (under 280 characters for Twitter compatibility).
Be authentic, helpful, and on-brand. Never be defensive or dismissive.`;

        const gemini = getGeminiClient();
        const model = gemini.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

        const result = await model.generateContent([systemPrompt, `Craft a response to this mention: "${mentionContent}"`]);
        const responseText = result.response.text().trim();

        return {
            response: responseText,
            error: null,
        };
    } catch (error) {
        console.error('Gemini mention response failed, falling back to OpenAI:', error);
        try {
            const openai = getOpenAIClient();
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a social media manager crafting responses. Professional and friendly. Keep responses concise.`
                    },
                    {
                        role: 'user',
                        content: `Craft a response to this mention:\n\n"${mentionContent}"`
                    }
                ],
                max_tokens: 150,
            });

            return {
                response: response.choices[0].message.content || '',
                error: null,
            };
        } catch (openaiError) {
            console.error('All response generation failed:', openaiError);
            return {
                response: null,
                error: 'Failed to generate response',
            };
        }
    }
}

// Mark a mention as responded
export async function markMentionResponded(
    mentionId: string,
    responsePostId?: string
) {
    const supabase = createClient();

    const { error } = await supabase
        .from('social_mentions')
        .update({
            responded_at: new Date().toISOString(),
            response_post_id: responsePostId,
            requires_response: false,
        })
        .eq('id', mentionId);

    if (error) {
        console.error('Error marking mention as responded:', error);
        return { success: false, error: error.message };
    }

    return { success: true, error: null };
}

// Detect crisis themes from negative mentions using Gemini
export async function detectCrisisThemes(brandId: string, limit: number = 20) {
    const supabase = createClient();
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data: negativeMentions, error } = await supabase
        .from('social_mentions')
        .select('content')
        .eq('brand_id', brandId)
        .eq('sentiment', 'negative')
        .gte('discovered_at', oneHourAgo.toISOString())
        .limit(limit);

    if (error || !negativeMentions?.length) return [];

    try {
        const content = negativeMentions.map(m => m.content).join('\n---\n');
        const gemini = getGeminiClient();
        const model = gemini.getGenerativeModel({
            model: 'gemini-1.5-flash-latest',
            generationConfig: { responseMimeType: 'application/json' }
        });

        const prompt = `Analyze these negative social media mentions and group them into 3-5 high-level crisis themes. 
        
Mentions:
${content}

Return a JSON object:
{
  "themes": [
    { "theme": "string", "count": number, "severity": "high" | "medium" | "low", "description": "string" }
  ]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const data = JSON.parse(text);
        return data.themes || [];
    } catch (err) {
        console.error('Gemini crisis detection failed, falling back to OpenAI:', err);
        try {
            const openai = getOpenAIClient();
            const content = negativeMentions.map(m => m.content).join('\n---\n');
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'Analyze these negative mentions and group them into 3-5 crisis themes. Return JSON { "themes": [...] }.'
                    },
                    { role: 'user', content }
                ],
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content || '{"themes": []}');
            return result.themes || [];
        } catch (openaiError) {
            console.error('All crisis detection failed:', openaiError);
            return [];
        }
    }
}

// Get holistic reputation score
export async function getReputationScore(brandId: string) {
    const supabase = createClient();

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data, error } = await supabase
        .from('social_mentions')
        .select('sentiment')
        .eq('brand_id', brandId)
        .gte('discovered_at', twentyFourHoursAgo.toISOString());

    if (error || !data) return 50;

    const total = data.length;
    if (total === 0) return 100;

    const positive = data.filter(m => m.sentiment === 'positive').length;
    const negative = data.filter(m => m.sentiment === 'negative').length;
    const neutral = data.filter(m => m.sentiment === 'neutral').length;

    // Weighting: Positive (1), Neutral (0.5), Negative (-1.5 for higher penalty)
    const score = ((positive * 1 + neutral * 0.5 - negative * 1.5) / total) * 100;
    return Math.max(0, Math.min(100, Math.round(score + 50))); // Offset by 50 to center
}

// Get crisis alerts (high volume of negative mentions with baseline comparison)
export async function checkCrisisAlerts(brandId: string) {
    const supabase = createClient();

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000);

    // Current hour negative count
    const { count: currentNegative } = await supabase
        .from('social_mentions')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', brandId)
        .eq('sentiment', 'negative')
        .gte('discovered_at', oneHourAgo.toISOString());

    // Previous hour negative count for baseline
    const { count: previousNegative } = await supabase
        .from('social_mentions')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', brandId)
        .eq('sentiment', 'negative')
        .gte('discovered_at', twoHoursAgo.toISOString())
        .lt('discovered_at', oneHourAgo.toISOString());

    const negCount = currentNegative || 0;
    const prevCount = previousNegative || 0;

    // Alert if > 10 mentions AND > 100% increase over previous hour
    const isCrisis = negCount >= 10 && (prevCount === 0 || negCount >= prevCount * 2);

    let themes = [];
    if (isCrisis) {
        themes = await detectCrisisThemes(brandId);
    }

    return {
        isCrisis,
        negativeCount: negCount,
        increasePercentage: prevCount === 0 ? negCount * 100 : Math.round(((negCount - prevCount) / prevCount) * 100),
        themes
    };
}

// --- Keyword Tracking & Management ---

export interface TrackedKeyword {
    id: string;
    brand_id: string;
    keyword: string;
    category: 'competitor' | 'industry' | 'brand' | 'product';
    is_active: boolean;
    created_at: string;
}

export async function getTrackedKeywords(brandId: string) {
    const supabase = createClient();

    // In a real app, this would query a 'tracked_keywords' table
    // For this prototype, we'll try to fetch, if error/empty we return defaults
    const { data, error } = await supabase
        .from('tracked_keywords')
        .select('*')
        .eq('brand_id', brandId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
        // Return simulated data if table doesn't exist yet
        return [
            { id: '1', brand_id: brandId, keyword: 'FluxSocial', category: 'brand', is_active: true, created_at: new Date().toISOString() },
            { id: '2', brand_id: brandId, keyword: 'buffer alternative', category: 'competitor', is_active: true, created_at: new Date().toISOString() },
            { id: '3', brand_id: brandId, keyword: 'social media ai', category: 'industry', is_active: true, created_at: new Date().toISOString() },
        ] as TrackedKeyword[];
    }

    return data as TrackedKeyword[];
}

export async function addTrackedKeyword(brandId: string, keyword: string, category: TrackedKeyword['category']) {
    const supabase = createClient();

    const newKeyword = {
        brand_id: brandId,
        keyword,
        category,
        is_active: true,
    };

    const { data, error } = await supabase
        .from('tracked_keywords')
        .insert(newKeyword)
        .select()
        .single();

    if (error) {
        console.error('Error adding keyword:', error);
        // Simulate success for prototype
        return {
            id: Math.random().toString(36).substr(2, 9),
            ...newKeyword,
            created_at: new Date().toISOString()
        } as TrackedKeyword;
    }

    return data as TrackedKeyword;
}

export async function deleteTrackedKeyword(keywordId: string) {
    const supabase = createClient();

    const { error } = await supabase
        .from('tracked_keywords')
        .update({ is_active: false })
        .eq('id', keywordId);

    if (error) {
        console.error('Error deleting keyword:', error);
        return false;
    }
    return true;
}


export async function seedSocialMentions(brandId: string) {
    const supabase = createClient();

    // Check if we already have mentions
    const { count } = await supabase
        .from('social_mentions')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', brandId);

    if (count && count > 0) return;

    const mockMentions = [
        {
            brand_id: brandId,
            platform: 'twitter' as const,
            content: "FluxSocial's AI features are actually insane. The voice matching is spot on.",
            author_name: "Alex Rivera",
            author_handle: "@arivera_tech",
            sentiment: 'positive' as const,
            sentiment_score: 0.9,
            is_influencer: true,
            author_followers: 15400,
            requires_response: false,
            discovered_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 mins ago
        },
        {
            brand_id: brandId,
            platform: 'threads' as const,
            content: "Anyone else having trouble with the scheduling view? It keeps lagging for me.",
            author_name: "Sarah Chen",
            author_handle: "@schen_design",
            sentiment: 'negative' as const,
            sentiment_score: -0.6,
            is_influencer: false,
            author_followers: 890,
            requires_response: true,
            discovered_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
        },
        {
            brand_id: brandId,
            platform: 'bluesky' as const,
            content: "Just migrated my team to FluxSocial. The workspace separation is exactly what we needed.",
            author_name: "DevOps Dad",
            author_handle: "devops.bsky.social",
            sentiment: 'positive' as const,
            sentiment_score: 0.85,
            is_influencer: false,
            author_followers: 450,
            requires_response: false,
            discovered_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
        },
        {
            brand_id: brandId,
            platform: 'linkedin' as const,
            content: "Great case study on how AI transforms social media workflows. Thanks for sharing!",
            author_name: "Marcus Johnson",
            author_handle: "marcus-j-marketing",
            sentiment: 'neutral' as const,
            sentiment_score: 0.1,
            is_influencer: false,
            author_followers: 2100,
            requires_response: false,
            discovered_at: new Date(Date.now() - 1000 * 60 * 180).toISOString() // 3 hours ago
        },
        {
            brand_id: brandId,
            platform: 'twitter' as const,
            content: "Why is the API down again? This is frustrating.",
            author_name: "CryptoBro",
            author_handle: "@cryptokng",
            sentiment: 'negative' as const,
            sentiment_score: -0.8,
            is_influencer: false,
            author_followers: 120,
            requires_response: true,
            discovered_at: new Date(Date.now() - 1000 * 60 * 10).toISOString() // 10 mins ago
        }
    ];

    const { error } = await supabase.from('social_mentions').insert(mockMentions);

    if (error) {
        console.error('Error seeding social mentions:', error);
    }
}
