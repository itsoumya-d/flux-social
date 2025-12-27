'use server';

import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization
let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
    if (!geminiClient) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is not set');
        }
        geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return geminiClient;
}

export type ContactProfile = {
    id: string;
    brand_id: string;
    platform: string;
    handle: string;
    name?: string;
    avatar_url?: string;
    bio?: string;
    tags: string[];
    sentiment_score: number; // 0-100, average of interactions
    interaction_count: number;
    last_interaction_at?: string;
    notes?: string;
    is_influencer: boolean;
    created_at: string;
    updated_at: string;
};

export type InternalNote = {
    id: string;
    contact_id: string;
    author_id: string;
    content: string;
    created_at: string;
};

// Get or create a contact profile based on handle and platform
export async function getContactProfile(brandId: string, platform: string, handle: string) {
    const supabase = createClient();

    // Try to find existing
    const { data: existing, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('brand_id', brandId)
        .eq('platform', platform)
        .eq('handle', handle)
        .single();

    if (existing) {
        return { profile: existing as ContactProfile, error: null };
    }

    // If not found, create new (this would usually be triggered by incoming messages)
    // For now, we return null to let the UI know or create a placeholder
    return { profile: null, error: 'Contact not found' };
}

// Fetch interaction history (messages & mentions) for a contact
export async function getInteractionHistory(brandId: string, handle: string) {
    const supabase = createClient();

    // Fetch messages
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('brand_id', brandId)
        .eq('sender_handle', handle)
        .order('created_at', { ascending: false });

    // Fetch mentions
    const { data: mentions } = await supabase
        .from('social_mentions')
        .select('*')
        .eq('brand_id', brandId)
        .eq('author_handle', handle)
        .order('discovered_at', { ascending: false });

    // Merge and sort
    const history = [
        ...(messages || []).map(m => ({ ...m, type: 'message', date: m.created_at })),
        ...(mentions || []).map(m => ({ ...m, type: 'mention', date: m.discovered_at }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return history;
}

// Add an internal team note to a contact
export async function addInternalNote(contactId: string, content: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const supabase = createClient();

    const { data, error } = await supabase
        .from('crm_notes')
        .insert({
            contact_id: contactId,
            author_id: userId,
            content: content
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding note:', error);
        return { note: null, error: error.message };
    }

    return { note: data as InternalNote, error: null };
}

// Get internal notes for a contact
export async function getInternalNotes(contactId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('crm_notes')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

    if (error) return [];

    return data as InternalNote[];
}

// Update contact tags
export async function updateContactTags(contactId: string, tags: string[]) {
    const supabase = createClient();

    const { error } = await supabase
        .from('crm_contacts')
        .update({ tags: tags })
        .eq('id', contactId);

    return { success: !error, error: error?.message };
}

// AI: Generate a "User DNA" summary based on history
export async function generateUserDNASummary(history: any[]) {
    try {
        if (!history || history.length === 0) return null;

        const validHistory = history.slice(0, 15); // limit to last 15 interactions
        const content = validHistory.map(h =>
            `[${h.type}] ${h.date}: ${h.content} (Sentiment: ${h.sentiment})`
        ).join('\n');

        const gemini = getGeminiClient();
        const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

        const prompt = `Analyze this user's interaction history with our brand and generate a "User DNA" profile.
        
        History:
        ${content}
        
        Return a JSON object with:
        {
            "persona": "Short description of the user type (e.g., 'Power User', 'Complainer', 'Brand Advocate')",
            "communicationStyle": "Formal/Casual/Emoji-heavy/etc",
            "keyInterests": ["topic1", "topic2"],
            "painPoints": ["issue1", "issue2"],
            "engagementLevel": "High/Medium/Low",
            "recommendedApproach": "How our team should communicate with them"
        }`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(text); // Try parsing raw if no clean match

    } catch (error) {
        console.error('User DNA generation failed:', error);
        return null; // Fail gracefully
    }
}
