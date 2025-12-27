import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// 🔒 SECURE: Use this in Server Actions to enforce RLS
export async function createAuthenticatedClient() {
    const { getToken } = await auth();
    // Use the 'supabase' template from Clerk Dashboard
    const token = await getToken({ template: 'supabase' });

    if (!token) {
        // Fallback or throw? For strict security, we might want to throw or return null.
        // For now, if no token, we return the anonymous client but the DB RLS will likely block access.
        // It is better to rely on RLS blocking than to mock an authenticated request.
        console.warn('⚠️ No Clerk Token validation found: Falling back to anonymous client.');
        return createSupabaseClient(supabaseUrl, supabaseAnonKey);
    }

    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    });
}
