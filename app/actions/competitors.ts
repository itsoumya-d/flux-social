'use server';

import { createClient } from '@/lib/supabase';
import OpenAI from 'openai';
import type { Competitor, CompetitorAnalytics, PlatformType } from '@/lib/types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Get all competitors for a brand
export async function getCompetitors(brandId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('competitors')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching competitors:', error);
        return { competitors: [], error: error.message };
    }

    return { competitors: data as Competitor[], error: null };
}

// Add a new competitor
export async function addCompetitor(
    brandId: string,
    competitor: {
        name: string;
        handles: Record<string, string>;
        websiteUrl?: string;
        notes?: string;
    }
) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('competitors')
        .insert({
            brand_id: brandId,
            name: competitor.name,
            handles: competitor.handles,
            website_url: competitor.websiteUrl,
            notes: competitor.notes,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding competitor:', error);
        return { competitor: null, error: error.message };
    }

    return { competitor: data as Competitor, error: null };
}

// Remove a competitor
export async function removeCompetitor(competitorId: string) {
    const supabase = createClient();

    const { error } = await supabase
        .from('competitors')
        .delete()
        .eq('id', competitorId);

    if (error) {
        console.error('Error removing competitor:', error);
        return { success: false, error: error.message };
    }

    return { success: true, error: null };
}

// Get competitor analytics
export async function getCompetitorAnalytics(
    competitorId: string,
    platform: PlatformType,
    days: number = 30
) {
    const supabase = createClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('competitor_analytics')
        .select('*')
        .eq('competitor_id', competitorId)
        .eq('platform', platform)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching competitor analytics:', error);
        return { analytics: [], error: error.message };
    }

    return { analytics: data as CompetitorAnalytics[], error: null };
}

// Compare your brand vs competitors (AI-powered insights)
export async function generateCompetitiveInsights(
    brandId: string,
    brandMetrics: {
        followers: number;
        engagementRate: number;
        postsPerWeek: number;
        topContentTypes: string[];
    },
    competitorMetrics: Array<{
        name: string;
        followers: number;
        engagementRate: number;
        postsPerWeek: number;
    }>
) {
    try {
        const prompt = `Analyze this competitive social media landscape and provide actionable insights:

YOUR BRAND:
- Followers: ${brandMetrics.followers.toLocaleString()}
- Engagement Rate: ${(brandMetrics.engagementRate * 100).toFixed(2)}%
- Posts per Week: ${brandMetrics.postsPerWeek}
- Top Content Types: ${brandMetrics.topContentTypes.join(', ')}

COMPETITORS:
${competitorMetrics.map(c => `
- ${c.name}: ${c.followers.toLocaleString()} followers, ${(c.engagementRate * 100).toFixed(2)}% engagement, ${c.postsPerWeek} posts/week`).join('')}

Provide a JSON response with:
1. "summary": 2-3 sentence executive summary
2. "strengths": array of 2-3 competitive advantages
3. "opportunities": array of 2-3 growth opportunities
4. "threats": array of 1-2 competitive threats to watch
5. "recommendations": array of 3 specific action items with priority (high/medium/low)

Return ONLY valid JSON.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a social media strategy expert providing competitive analysis.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.4,
            max_tokens: 800,
        });

        const insights = JSON.parse(response.choices[0].message.content || '{}');
        return { insights, error: null };
    } catch (error) {
        console.error('Error generating insights:', error);
        return {
            insights: null,
            error: 'Failed to generate competitive insights',
        };
    }
}

// Get hashtag performance comparison
export async function compareHashtagPerformance(brandId: string, limit: number = 10) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('hashtag_analytics')
        .select('*')
        .eq('brand_id', brandId)
        .order('avg_engagement_rate', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching hashtag performance:', error);
        return { hashtags: [], error: error.message };
    }

    return { hashtags: data, error: null };
}

// Get content gap analysis
export async function getContentGapAnalysis(
    brandId: string,
    competitorIds: string[]
) {
    try {
        // In production, this would analyze actual competitor content
        // For now, return simulated AI-powered analysis
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a content strategy expert identifying content gaps.',
                },
                {
                    role: 'user',
                    content: `Generate a content gap analysis for a social media brand. Return a JSON object with:
- "underutilizedFormats": array of content formats the brand should use more (e.g., "carousel posts", "Reels", "Twitter threads")
- "missingTopics": array of trending topics competitors cover that this brand doesn't
- "timingGaps": array of optimal posting times that aren't being utilized
- "engagementOpportunities": array of engagement tactics to try

Return ONLY valid JSON.`,
                },
            ],
            temperature: 0.5,
            max_tokens: 500,
        });

        const analysis = JSON.parse(response.choices[0].message.content || '{}');
        return { analysis, error: null };
    } catch (error) {
        console.error('Error generating content gap analysis:', error);
        return { analysis: null, error: 'Failed to generate analysis' };
    }
}
