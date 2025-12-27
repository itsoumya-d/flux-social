import { createClient as createSupabaseClient } from '@supabase/supabase-js';
// import { auth } from '@clerk/nextjs/server'; // Removed to fix server-only leak

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Keep the anonymous client for simple client-side use (if needed) 
// but WARN against using it for data mutations.
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// 🔒 SECURE: Use createAuthenticatedClient from '@/lib/supabase-server' in Server Actions
// This file is safe for Client Components (Public/Anon access only)

// Legacy helper - mark as deprecated if you want to be strict
export function createClient() {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}


