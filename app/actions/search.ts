'use server';

import { supabase } from '@/lib/supabase';
import { ensureDefaultBrand } from './brands';

export async function globalSearch(query: string) {
    const brand = await ensureDefaultBrand();
    if (!brand) return [];

    const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('brand_id', brand.id)
        .ilike('content', `%${query}%`)
        .limit(5);

    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(3);

    const results: any[] = [];

    if (posts) {
        results.push(...posts.map(p => ({
            id: p.id,
            type: 'post',
            title: p.content.slice(0, 30) + '...',
            href: `/composer?id=${p.id}`
        })));
    }

    if (profiles) {
        results.push(...profiles.map(p => ({
            id: p.id,
            type: 'member',
            title: p.full_name || p.email,
            href: `/team`
        })));
    }

    // Add a magic "Flux Command" if query looks like a question
    if (query.includes('?') || query.length > 10) {
        results.push({
            id: 'flux-ask',
            type: 'command',
            title: `Ask Flux: "${query}"`,
            href: `/analytics?q=${encodeURIComponent(query)}`
        });
    }

    return results;
}
