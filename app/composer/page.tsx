export const dynamic = 'force-dynamic';
import Composer from "@/components/composer";
import { ensureDefaultBrand } from "@/app/actions/brands";
import { supabase } from "@/lib/supabase";

export default async function ComposerPage({
    searchParams
}: {
    searchParams: Promise<{ id?: string; draft?: string }>
}) {
    const { id } = await searchParams;
    const brand = await ensureDefaultBrand();
    let initialPost = null;

    if (id) {
        const { data } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();
        initialPost = data;
    } else if (searchParams) {
        // Handle onboarding draft
        const { draft } = await searchParams;
        if (draft) {
            initialPost = { content: decodeURIComponent(draft as string) };
        }
    }

    return <Composer brandId={brand?.id} initialPost={initialPost} />;
}
