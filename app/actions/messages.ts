'use server';

import { supabase, createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { createNotification } from './notifications';
import { getAllProfiles } from './profiles';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization to prevent build failures when API keys are not set
let openaiClient: OpenAI | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

function getOpenAIClient(): OpenAI {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

function getGeminiClient(): GoogleGenerativeAI {
    if (!geminiClient) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is not set');
        }
        geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return geminiClient;
}

export async function getMessages(
    brandId: string,
    options: {
        platform?: string;
        sentiment?: string;
        minPriority?: number;
        isRead?: boolean;
        isImportant?: boolean;
        limit?: number;
    } = {}
) {
    const { userId } = await auth();

    if (!userId) {
        return [];
    }

    let query = supabase
        .from('messages')
        .select('*')
        .eq('brand_id', brandId)
        .eq('is_deleted', false) // Exclude soft-deleted
        .order('created_at', { ascending: false });

    if (options.platform) {
        query = query.eq('platform', options.platform);
    }
    if (options.sentiment) {
        query = query.eq('sentiment', options.sentiment);
    }
    if (options.minPriority) {
        query = query.gte('priority_score', options.minPriority);
    }
    if (options.isRead !== undefined) {
        query = query.eq('is_read', options.isRead);
    }
    if (options.isImportant !== undefined) {
        query = query.eq('is_important', options.isImportant);
    }

    if (options.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }

    return data;
}

export async function seedMessages(brandId: string) {
    const existing = await getMessages(brandId);
    if (existing.length > 0) return;

    const initialMessages = [
        {
            brand_id: brandId,
            sender_name: 'Jared Palmer',
            sender_handle: '@jaredp',
            platform: 'twitter',
            content: "Really loving the new Flux interface! Can you tell me more about the AI strategy features?",
            sender_avatar: 'https://i.pravatar.cc/150?u=jared',
            sentiment: 'positive',
            priority_score: 85,
            is_important: true
        },
        {
            brand_id: brandId,
            sender_name: 'Vercel Team',
            sender_handle: 'vercel',
            platform: 'linkedin',
            content: "Great thread on performance optimization. We'd love to partner on a technical deep dive.",
            sender_avatar: 'https://i.pravatar.cc/150?u=vercel',
            sentiment: 'positive',
            priority_score: 95,
            is_important: true
        },
        {
            brand_id: brandId,
            sender_name: 'Sarah Drasner',
            sender_handle: '@sdras',
            platform: 'instagram',
            content: "The animations here are butter smooth. What engine are you using?",
            sender_avatar: 'https://i.pravatar.cc/150?u=sarah',
            sentiment: 'positive',
            priority_score: 70,
            is_important: false
        },
        {
            brand_id: brandId,
            sender_name: 'Mike Thompson',
            sender_handle: '@mikethompson',
            platform: 'twitter',
            content: "Having issues with the scheduler. Can someone help?",
            sender_avatar: 'https://i.pravatar.cc/150?u=mike',
            sentiment: 'negative',
            priority_score: 90,
            is_important: true
        },
        {
            brand_id: brandId,
            sender_name: 'TechCrunch',
            sender_handle: '@techcrunch',
            platform: 'twitter',
            content: "We're working on a piece about AI-powered social tools. Would love to feature Flux.",
            sender_avatar: 'https://i.pravatar.cc/150?u=techcrunch',
            sentiment: 'positive',
            priority_score: 100,
            is_important: true
        }
    ];

    const { error } = await supabase.from('messages').insert(initialMessages);
    if (error) console.error('Error seeding messages:', error);
}

export async function sendMessage(brandId: string, content: string, platform: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { data, error } = await supabase
        .from('messages')
        .insert({
            brand_id: brandId,
            platform,
            content,
            sender_name: 'You',
            sender_handle: '@brand',
            sentiment: 'neutral',
            priority_score: 0,
            is_read: true
        })
        .select()
        .single();

    if (error) {
        console.error('Error sending message:', error);
        throw new Error('Failed to send message');
    }

    // Notify other team members
    try {
        const allProfiles = await getAllProfiles();
        const others = allProfiles.filter(p => p.id !== userId);

        for (const profile of others) {
            await createNotification(
                profile.id,
                'New Reply Sent',
                `A team member replied to a message on ${platform}.`,
                'message'
            );
        }
    } catch (err) {
        console.error('Notification logic failed:', err);
    }

    return data;
}

// ===== AI-POWERED RESPONSE GENERATION =====

export async function generateAIResponse(messageContent: string, brandVoice?: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const systemPrompt = `You are a professional social media manager responding to messages on behalf of a brand.
${brandVoice ? `Brand voice guidelines: ${brandVoice}` : 'Be professional, friendly, and helpful.'}

Generate a natural, engaging response that:
- Directly addresses the person's question or comment
- Maintains a warm, professional tone
- Is concise but complete
- Invites further conversation when appropriate`;

    const userPrompt = `Generate a professional response to this social media message:

"${messageContent}"

Return ONLY the response text, nothing else.`;

    try {
        const gemini = getGeminiClient();
        const model = gemini.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

        const result = await model.generateContent([systemPrompt, userPrompt]);
        const reply = result.response.text().trim();

        return {
            reply,
            confidence: 0.98,
            success: true,
            model: 'gemini-1.5-pro'
        };
    } catch (error) {
        console.error('Gemini response generation failed, falling back to OpenAI:', error);
        try {
            const response = await getOpenAIClient().chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 300,
                temperature: 0.7,
            });

            const reply = response.choices[0]?.message?.content?.trim() || '';

            return {
                reply,
                confidence: 0.92,
                success: true,
                model: 'gpt-4o'
            };
        } catch (openaiError) {
            console.error('All AI response generation failed:', openaiError);

            // Fallback to heuristic-based response
            let reply = "";
            const lower = messageContent.toLowerCase();

            if (lower.includes('interface') || lower.includes('ai strategy')) {
                reply = "Thanks for the shoutout! Our AI strategy focuses on predictive trend analysis and tone consistency. I'd be happy to set up a quick demo for you. Does Thursday work?";
            } else if (lower.includes('partnership') || lower.includes('partner')) {
                reply = "We're absolutely thrilled about the possibility of a technical deep dive. Let's sync with our product team to align on the best approach. Are you free next Tuesday?";
            } else if (lower.includes('animation') || lower.includes('engine')) {
                reply = "Thanks! We're using Framer Motion with some custom CSS spring physics for that butter-smooth feel. Always happy to talk shop about front-end performance!";
            } else if (lower.includes('issue') || lower.includes('help') || lower.includes('problem')) {
                reply = "Sorry to hear you're experiencing issues! Our team is here to help. Could you share more details about what's happening? We'll get this resolved ASAP.";
            } else if (lower.includes('feature') || lower.includes('love')) {
                reply = "We're so glad you're enjoying it! Your feedback means a lot to us. Feel free to share any other thoughts—we're always looking for ways to improve!";
            } else {
                reply = "Thanks for reaching out! We've received your message and our team will get back to you shortly. In the meantime, feel free to check out our docs.";
            }

            return {
                reply,
                confidence: 0.75,
                success: true
            };
        }
    }
}

// ===== SENTIMENT ANALYSIS =====

export async function analyzeSentiment(content: string) {
    try {
        const gemini = getGeminiClient();
        const model = gemini.getGenerativeModel({
            model: 'gemini-1.5-flash-latest',
            generationConfig: { responseMimeType: 'application/json' }
        });

        const prompt = `Analyze the sentiment of this social media message and return a JSON object:

"${content}"

Return format:
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": 0-100 (confidence),
  "emotions": ["emotion1", "emotion2"],
  "urgency": "low" | "medium" | "high",
  "requiresResponse": true | false,
  "summary": "one sentence summary of intent"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        return JSON.parse(text);
    } catch (error) {
        console.error('Gemini sentiment analysis failed, falling back to OpenAI:', error);
        try {
            const response = await getOpenAIClient().chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a sentiment analysis expert. Analyze the sentiment of social media messages and return JSON.'
                    },
                    {
                        role: 'user',
                        content: content
                    }
                ],
                response_format: { type: 'json_object' }
            });

            const result = response.choices[0]?.message?.content?.trim() || '{}';
            return JSON.parse(result);
        } catch (openaiError) {
            console.error('Sentiment analysis failed entirely:', openaiError);
            return {
                sentiment: 'neutral',
                score: 50,
                emotions: [],
                urgency: 'medium',
                requiresResponse: true
            };
        }
    }
}

// ===== PRIORITY SCORING =====

export async function calculatePriority(message: {
    content: string;
    sender_handle: string;
    platform: string;
    sentiment?: string;
}) {
    let score = 50; // Base score

    // Sentiment-based scoring
    if (message.sentiment === 'negative') score += 25;
    if (message.sentiment === 'positive') score += 10;

    // Platform priority (business platforms higher)
    if (message.platform === 'linkedin') score += 15;
    if (message.platform === 'twitter') score += 10;

    // Content-based scoring
    const content = message.content.toLowerCase();
    if (content.includes('urgent') || content.includes('asap')) score += 20;
    if (content.includes('partner') || content.includes('collaboration')) score += 20;
    if (content.includes('issue') || content.includes('problem') || content.includes('help')) score += 15;
    if (content.includes('feature') || content.includes('press') || content.includes('media')) score += 15;
    if (content.includes('buy') || content.includes('pricing') || content.includes('demo')) score += 20;

    // Verified account detection (mock - would check via API in production)
    if (message.sender_handle.includes('verified') ||
        ['@techcrunch', '@vercel', '@github'].includes(message.sender_handle.toLowerCase())) {
        score += 25;
    }

    return Math.min(100, score);
}

// ===== MESSAGE ACTIONS =====

export async function markAsRead(messageId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

    if (error) throw new Error('Failed to mark as read');
    return { success: true };
}

export async function markAsImportant(messageId: string, isImportant: boolean) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('messages')
        .update({ is_important: isImportant })
        .eq('id', messageId);

    if (error) throw new Error('Failed to update importance');
    return { success: true };
}

export async function deleteMessage(messageId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true }) // Soft delete for analytics
        .eq('id', messageId);

    if (error) throw new Error('Failed to delete message');
    return { success: true };
}

// ===== SOCIAL LISTENING (Simulated) =====

export async function getMentions(brandId: string, keywords: string[]) {
    const supabase = createClient();

    let query = supabase
        .from('social_mentions')
        .select('*')
        .eq('brand_id', brandId)
        .order('discovered_at', { ascending: false });

    if (keywords.length > 0) {
        // Simple keyword match in Supabase
        query = query.or(keywords.map(k => `content.ilike.%${k}%`).join(','));
    }

    const { data: mockMentions, error } = await query;

    if (error || !mockMentions) {
        console.error('Error fetching mentions:', error);
        return { mentions: [], totalReach: 0, sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 } };
    }

    return {
        mentions: mockMentions,
        totalReach: mockMentions.reduce((sum: number, m: any) => sum + (m.reach_estimate || 0), 0),
        sentimentBreakdown: {
            positive: mockMentions.filter((m: any) => m.sentiment === 'positive').length,
            neutral: mockMentions.filter((m: any) => m.sentiment === 'neutral').length,
            negative: mockMentions.filter((m: any) => m.sentiment === 'negative').length
        }
    };
}
