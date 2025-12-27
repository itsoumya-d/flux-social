'use server';

import { auth } from '@clerk/nextjs/server';
import { createAuthenticatedClient } from '@/lib/supabase-server';
import OpenAI from 'openai';

export type PulseItem = {
    id: string;
    content: string;
    author: string;
    platform: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    created_at: string;
    entities: string[];
};

/**
 * Fetches initial historical pulse data for the dashboard.
 */
export async function getPulseData(brandId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const supabase = await createAuthenticatedClient();
    const { data: mentions, error } = await supabase
        .from('social_mentions')
        .select('*')
        .eq('brand_id', brandId)
        .order('discovered_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching pulse items:', error);
        return [];
    }

    // Map to PulseItem type
    return (mentions || []).map((m: any) => ({
        id: m.id,
        content: m.content,
        author: m.author_handle || m.author_name,
        platform: m.platform,
        sentiment: m.sentiment as any,
        created_at: m.discovered_at,
        entities: m.keywords_matched || []
    })) as PulseItem[];
}

/**
 * AI-powered analysis for a single pulse item.
 * Extracts entities and performs granular sentiment analysis.
 */
export async function analyzePulseItem(content: string) {
    if (!process.env.OPENAI_API_KEY) {
        return { sentiment: 'neutral', entities: [] };
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'Analyze the following social media mention. Return a JSON object with labels: sentiment (positive/negative/neutral) and entities (array of strings representing key brands, people, or products mentioned).'
                },
                { role: 'user', content }
            ],
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return {
            sentiment: result.sentiment || 'neutral',
            entities: result.entities || []
        };
    } catch (error) {
        console.error('Pulse AI analysis failed:', error);
        return { sentiment: 'neutral', entities: [] };
    }
}

/**
 * Utility to simulate a high-velocity mention spike for Demo/QA.
 */
export async function simulatePulseStream(brandId: string) {
    // This would typically publish to Ably or a similar service
    // For now, we'll return a batch of simulated items
    const platforms = ['twitter', 'instagram', 'linkedin', 'reddit', 'threads'];
    const mockContents = [
        "Loving the new @flux interface! So smooth.",
        "Anyone else having issues with @flux scheduling today?",
        "Flux Social is a game changer for my agency.",
        "Why is @flux better than Buffer? Discuss.",
        "Just generated my first AI image with 🚀 @flux. Wow.",
        "Support response time on @flux has been slow lately.",
    ];

    const batch: PulseItem[] = mockContents.map((content, i) => ({
        id: `sim_${Date.now()}_${i}`,
        content,
        author: `user_${Math.floor(Math.random() * 1000)}`,
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        sentiment: content.includes('Loving') || content.includes('game changer') ? 'positive' : (content.includes('slow') || content.includes('issues') ? 'negative' : 'neutral'),
        created_at: new Date().toISOString(),
        entities: ['Flux', 'Buffer', 'AI']
    }));

    return batch;
}
