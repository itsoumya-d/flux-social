'use server';

import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function uploadMedia(formData: FormData) {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const file = formData.get('file') as File;
    const brandId = formData.get('brandId') as string;

    if (!file || !brandId) {
        throw new Error('Missing file or brandId');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${brandId}/${fileName}`;

    const { data, error } = await supabase.storage
        .from('media-library')
        .upload(filePath, file);

    if (error) {
        console.error('Upload error:', error);
        throw new Error('Failed to upload file');
    }

    const { data: { publicUrl } } = supabase.storage
        .from('media-library')
        .getPublicUrl(filePath);

    // Save to content_library table
    const { data: asset, error: dbError } = await supabase
        .from('content_library')
        .insert({
            brand_id: brandId,
            uploaded_by: userId,
            file_url: publicUrl,
            file_type: file.type.startsWith('image/') ? 'image' : 'video',
            file_name: file.name,
            file_size: file.size,
        })
        .select()
        .single();

    if (dbError) {
        console.error('DB error:', dbError);
        // We don't throw here to avoid failing if the file uploaded but DB failed
    }

    return { url: publicUrl, asset };
}

export async function getAssetLibrary(brandId: string) {
    const { data, error } = await supabase
        .from('content_library')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Fetch error:', error);
        return [];
    }

    return data;
}

export async function searchUnsplash(query: string) {
    // In production, use UNSPLASH_ACCESS_KEY
    // For demo, return mock or use a public endpoint if available
    // Mocking for now to avoid dependency on env vars I might not have
    return [
        { id: '1', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=60', photographer: 'Alex Kotliarskyi' },
        { id: '2', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=60', photographer: 'Sami Al-Halabi' },
        { id: '3', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=60', photographer: 'Desola Lanre-Ologun' }
    ];
}
