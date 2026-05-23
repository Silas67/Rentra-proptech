import { supabase } from "@/lib/supabase";

export type StorefrontStats = {
    totalViews: number;
    uniqueProperties: number;
    totalBookings: number;
    conversionRate: number;
    viewsByDay: { date: string; views: number }[];
};

export const analyticsService = {

    // 📊 Log a storefront view
    async logStorefrontView(agentId: string, propertyId?: string) {
        await supabase
            .from("storefront_views")
            .insert({
                agent_id: agentId,
                property_id: propertyId ?? null,
                referrer: document.referrer || null,
            });
    },

    // 📈 Get storefront stats for an agent
    async getStorefrontStats(agentId: string): Promise<StorefrontStats> {
        // Get all views in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: views } = await supabase
            .from("storefront_views")
            .select("created_at, property_id")
            .eq("agent_id", agentId)
            .gte("created_at", thirtyDaysAgo.toISOString());

        // Get bookings attributed to this agent
        const { data: bookings } = await supabase
            .from("bookings")
            .select("id")
            .eq("agent_id", agentId)
            .gte("created_at", thirtyDaysAgo.toISOString());

        const totalViews = views?.length ?? 0;
        const totalBookings = bookings?.length ?? 0;
        const uniqueProperties = new Set(views?.map((v) => v.property_id).filter(Boolean)).size;
        const conversionRate = totalViews > 0 ? Math.round((totalBookings / totalViews) * 100) : 0;

        // Group views by day for chart
        const viewsByDayMap: Record<string, number> = {};
        views?.forEach((v) => {
            const day = new Date(v.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
            viewsByDayMap[day] = (viewsByDayMap[day] ?? 0) + 1;
        });

        // Fill in last 14 days even if no views
        const viewsByDay: { date: string; views: number }[] = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const label = d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
            viewsByDay.push({ date: label, views: viewsByDayMap[label] ?? 0 });
        }

        return { totalViews, uniqueProperties, totalBookings, conversionRate, viewsByDay };
    },
};