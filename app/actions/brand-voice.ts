'use server';

import { createClient } from '@/lib/supabase';
import OpenAI from 'openai';
import type { BrandVoice, PlatformType } from '@/lib/types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Get brand voice for a brand
export async function getBrandVoice(brandId: string): Promise<BrandVoice | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('brand_voices')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching brand voice:', error);
        return null;
    }

    return data as BrandVoice;
}

// Create or update brand voice
export async function saveBrandVoice(
    brandId: string,
    voice: {
        name?: string;
        toneFormality?: number;
        toneEnthusiasm?: number;
        toneHumor?: number;
        toneTechnicality?: number;
        keyPhrases?: string[];
        avoidPhrases?: string[];
        styleExamples?: { content: string; platform: PlatformType }[];
    }
) {
    const supabase = createClient();

    const voiceData = {
        brand_id: brandId,
        name: voice.name || 'Default',
        tone_formality: voice.toneFormality,
        tone_enthusiasm: voice.toneEnthusiasm,
        tone_humor: voice.toneHumor,
        tone_technicality: voice.toneTechnicality,
        key_phrases: voice.keyPhrases,
        avoid_phrases: voice.avoidPhrases,
        style_examples: voice.styleExamples,
        updated_at: new Date().toISOString(),
    };

    // Check if brand voice exists
    const { data: existing } = await supabase
        .from('brand_voices')
        .select('id')
        .eq('brand_id', brandId)
        .limit(1)
        .single();

    let result;
    if (existing) {
        result = await supabase
            .from('brand_voices')
            .update(voiceData)
            .eq('id', existing.id)
            .select()
            .single();
    } else {
        result = await supabase
            .from('brand_voices')
            .insert(voiceData)
            .select()
            .single();
    }

    if (result.error) {
        console.error('Error saving brand voice:', result.error);
        return { voice: null, error: result.error.message };
    }

    return { voice: result.data as BrandVoice, error: null };
}

// Train brand voice from sample content
export async function trainBrandVoice(
    brandId: string,
    sampleContent: { content: string; platform: PlatformType }[]
) {
    try {
        // Analyze the sample content to extract voice characteristics
        const analysisPrompt = `Analyze these sample social media posts and extract the brand's voice characteristics.

Sample posts:
${sampleContent.map((s, i) => `${i + 1}. [${s.platform}] "${s.content}"`).join('\n')}

Return a JSON object with:
- formality: 0-1 scale (0 = very casual, 1 = very formal)
- enthusiasm: 0-1 scale (0 = reserved, 1 = very enthusiastic)
- humor: 0-1 scale (0 = serious, 1 = very humorous)
- technicality: 0-1 scale (0 = simple language, 1 = technical jargon)
- keyPhrases: array of distinctive phrases/words this brand uses
- avoidPhrases: array of phrases/tones this brand seems to avoid
- personality: brief description of brand personality

Return ONLY valid JSON.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a brand voice analyst. Analyze content and extract voice characteristics.' },
                { role: 'user', content: analysisPrompt }
            ],
            temperature: 0.3,
            max_tokens: 500,
        });

        const analysis = JSON.parse(response.choices[0].message.content || '{}');

        // Generate embedding for the combined sample content
        const combinedContent = sampleContent.map(s => s.content).join(' ');
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: combinedContent,
        });

        const embedding = embeddingResponse.data[0].embedding;

        // Save the trained voice
        const supabase = createClient();

        const { data, error } = await supabase
            .from('brand_voices')
            .upsert({
                brand_id: brandId,
                name: 'Trained Voice',
                tone_formality: analysis.formality || 0.5,
                tone_enthusiasm: analysis.enthusiasm || 0.5,
                tone_humor: analysis.humor || 0.3,
                tone_technicality: analysis.technicality || 0.5,
                key_phrases: analysis.keyPhrases || [],
                avoid_phrases: analysis.avoidPhrases || [],
                style_examples: sampleContent,
                embedding_vector: embedding,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'brand_id' })
            .select()
            .single();

        if (error) {
            console.error('Error saving trained voice:', error);
            return { voice: null, analysis: null, error: error.message };
        }

        return {
            voice: data as BrandVoice,
            analysis: {
                ...analysis,
                personality: analysis.personality,
            },
            error: null,
        };
    } catch (error) {
        console.error('Error training brand voice:', error);
        return { voice: null, analysis: null, error: 'Failed to train brand voice' };
    }
}

// Generate content in brand voice
export async function generateInBrandVoice(
    brandId: string,
    prompt: string,
    platform: PlatformType,
    options?: {
        maxLength?: number;
        includeHashtags?: boolean;
        includeEmojis?: boolean;
    }
) {
    try {
        // Get the brand voice
        const brandVoice = await getBrandVoice(brandId);

        const platformLimits: Record<PlatformType, number> = {
            twitter: 280,
            instagram: 2200,
            linkedin: 3000,
            facebook: 500,
            tiktok: 2200,
            pinterest: 500,
            youtube: 5000,
            threads: 500,
            bluesky: 300,
            google_business: 1500,
        };

        const maxLength = options?.maxLength || platformLimits[platform] || 500;

        let voiceInstructions = '';
        if (brandVoice) {
            voiceInstructions = `
Voice Guidelines:
- Formality: ${brandVoice.tone_formality > 0.6 ? 'formal and professional' : brandVoice.tone_formality < 0.4 ? 'casual and conversational' : 'balanced'}
- Energy: ${brandVoice.tone_enthusiasm > 0.6 ? 'enthusiastic and upbeat' : brandVoice.tone_enthusiasm < 0.4 ? 'calm and measured' : 'moderately energetic'}
- Humor: ${brandVoice.tone_humor > 0.5 ? 'incorporate light humor' : 'keep it professional'}
- Key phrases to use: ${brandVoice.key_phrases?.slice(0, 5).join(', ') || 'none specified'}
- Phrases to avoid: ${brandVoice.avoid_phrases?.slice(0, 5).join(', ') || 'none specified'}
`;
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are a social media content creator. Create engaging content for ${platform}.
${voiceInstructions}

Requirements:
- Maximum ${maxLength} characters
- ${options?.includeHashtags ? 'Include 3-5 relevant hashtags' : 'Do not include hashtags'}
- ${options?.includeEmojis ? 'Use appropriate emojis' : 'Minimal or no emojis'}
- Optimize for ${platform}'s audience and format
- Make it engaging and shareable`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        const content = response.choices[0].message.content || '';

        return {
            content,
            characterCount: content.length,
            platform,
            error: null,
        };
    } catch (error) {
        console.error('Error generating content:', error);
        return {
            content: null,
            characterCount: 0,
            platform,
            error: 'Failed to generate content',
        };
    }
}

// Adapt existing content to brand voice
export async function adaptToBrandVoice(
    brandId: string,
    originalContent: string,
    targetPlatform: PlatformType
) {
    const brandVoice = await getBrandVoice(brandId);

    if (!brandVoice) {
        return {
            content: originalContent,
            error: 'No brand voice configured'
        };
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Adapt the following content to match this brand voice:
- Formality: ${brandVoice.tone_formality}/1
- Enthusiasm: ${brandVoice.tone_enthusiasm}/1
- Humor: ${brandVoice.tone_humor}/1
- Key phrases to incorporate: ${brandVoice.key_phrases?.join(', ') || 'none'}
- Phrases to avoid: ${brandVoice.avoid_phrases?.join(', ') || 'none'}

Optimize for ${targetPlatform}. Keep the core message but adjust tone and style.`
                },
                {
                    role: 'user',
                    content: originalContent
                }
            ],
            temperature: 0.6,
            max_tokens: 500,
        });

        return {
            content: response.choices[0].message.content || originalContent,
            error: null,
        };
    } catch (error) {
        console.error('Error adapting content:', error);
        return {
            content: originalContent,
            error: 'Failed to adapt content',
        };
    }
}
