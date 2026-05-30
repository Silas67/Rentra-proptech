/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/lib/supabase";

export type SearchFilters = {
    query?: string;
    type?: string;
    listingType?: string;
    priceRange?: string;
    city?: string;
};

export type SavedSearch = {
    id: string;
    tenantId: string;
    label: string;
    filters: SearchFilters;
    alertEnabled: boolean;
    createdAt: string;
};

const mapSearch = (s: Record<string, any>): SavedSearch => ({
    id: s.id,
    tenantId: s.tenant_id,
    label: s.label,
    filters: s.filters,
    alertEnabled: s.alert_enabled,
    createdAt: s.created_at,
});

export const savedSearchService = {

    async getSavedSearches(tenantId: string): Promise<SavedSearch[]> {
        const { data, error } = await supabase
            .from("saved_searches")
            .select("*")
            .eq("tenant_id", tenantId)
            .order("created_at", { ascending: false });

        if (error) return [];
        return (data ?? []).map(mapSearch);
    },

    async saveSearch(tenantId: string, label: string, filters: SearchFilters): Promise<SavedSearch | null> {
        const { data, error } = await supabase
            .from("saved_searches")
            .insert({
                tenant_id: tenantId,
                label,
                filters,
                alert_enabled: true,
            })
            .select()
            .single();

        if (error || !data) return null;
        return mapSearch(data);
    },

    async deleteSearch(id: string): Promise<boolean> {
        const { error } = await supabase
            .from("saved_searches")
            .delete()
            .eq("id", id);
        return !error;
    },

    async toggleAlert(id: string, enabled: boolean): Promise<boolean> {
        const { error } = await supabase
            .from("saved_searches")
            .update({ alert_enabled: enabled })
            .eq("id", id);
        return !error;
    },
};
