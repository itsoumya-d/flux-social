export const dynamic = 'force-dynamic';
import { ContentCalendar } from '@/components/content-calendar';
import { ensureDefaultBrand } from "@/app/actions/brands";

export default async function CalendarPage() {
    const brand = await ensureDefaultBrand();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ContentCalendar brandId={brand?.id} />
        </div>
    );
}
