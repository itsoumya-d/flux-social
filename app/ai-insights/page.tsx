export const dynamic = 'force-dynamic';
import StrategyView from "./strategy-view";
import { ensureDefaultBrand } from "@/app/actions/brands";
import { getAIStrategy } from "@/app/actions/ai";

export default async function AIInsightsPage() {
    const brand = await ensureDefaultBrand();
    const strategies = brand ? await getAIStrategy(brand.id) : [];

    return <StrategyView initialStrategies={strategies} />;
}
