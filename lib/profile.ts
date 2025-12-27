import { supabase } from './supabase';

export async function syncProfile(user: {
    id: string;
    emailAddresses: { emailAddress: string }[];
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string;
}) {
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            avatar_url: user.imageUrl,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
        .select()
        .single();

    if (error) {
        console.error('Error syncing profile:', error);
        return null;
    }

    return data;
}
