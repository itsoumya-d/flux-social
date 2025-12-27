export const dynamic = 'force-dynamic';
import CommunityPageClient from "./community-page-client";
import { ensureDefaultBrand } from "@/app/actions/brands";
import { getUnifiedFeed } from "@/app/actions/unified-feed";
import { seedMessages } from "@/app/actions/messages";
import { seedSocialMentions } from "@/app/actions/social-listening";

export default async function CommunityPage() {
    const brand = await ensureDefaultBrand();

    // Seed data if needed for prototype/demo visibility
    if (brand) {
        await Promise.all([
            seedMessages(brand.id),
            seedSocialMentions(brand.id)
        ]);
    }

    const feedItems = brand ? await getUnifiedFeed(brand.id) : [];

    return (
        <CommunityPageClient
            initialFeedItems={feedItems}
            brandId={brand?.id}
            brandVoice={brand?.brand_voice_profile}
        />
    );
}

