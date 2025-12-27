export const dynamic = 'force-dynamic';

import IntelligenceView from "./intelligence-view";
import { ensureDefaultBrand } from "@/app/actions/brands";
import { getPosts } from "@/app/actions/posts";
import { getGrowthStats, getPredictiveMetrics, generateAIAnalyticsInsights } from "@/app/actions/analytics";

export default async function AnalyticsPage() {
    const brand = await ensureDefaultBrand();
    const brandId = brand?.id || '';

    const posts = brand ? await getPosts(brandId) : [];
    const growth = brand ? await getGrowthStats(brandId) : null;
    const predictiveMetrics = brand ? await getPredictiveMetrics(brandId) : null;
    const aiInsights = brand ? await generateAIAnalyticsInsights(brandId) : null;

    const stats = {
        totalPosts: posts.length,
        scheduledPosts: posts.filter(p => p.status === 'scheduled').length,
        draftPosts: posts.filter(p => p.status === 'draft').length,
    };

    return (
        <IntelligenceView
            stats={stats}
            growth={growth}
            predictiveMetrics={predictiveMetrics}
            aiInsights={aiInsights}
            brandId={brandId}
        />
    );
}
