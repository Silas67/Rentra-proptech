/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/lib/supabase";

export const BOOST_AMOUNT = 2500; // ₦2,500
export const BOOST_DAYS = 7;

export const boostService = {

    // ➕ Create a boost after successful payment
    async createBoost(payload: {
        propertyId: string;
        agentId?: string;
        landlordId?: string;
        paystackReference: string;
    }): Promise<boolean> {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + BOOST_DAYS);

        const { error: boostError } = await supabase
            .from("boosted_listings")
            .insert({
                property_id: payload.propertyId,
                agent_id: payload.agentId ?? null,
                landlord_id: payload.landlordId ?? null,
                amount: BOOST_AMOUNT,
                paystack_reference: payload.paystackReference,
                expires_at: expiresAt.toISOString(),
                status: "active",
            });

        if (boostError) {
            console.error("createBoost error:", boostError);
            return false;
        }

        // Mark property as boosted
        await supabase
            .from("properties")
            .update({
                is_boosted: true,
                boost_expires_at: expiresAt.toISOString(),
            })
            .eq("id", payload.propertyId);

        return true;
    },

    // 🔍 Check if a property is currently boosted
    async isPropertyBoosted(propertyId: string): Promise<boolean> {
        const { data } = await supabase
            .from("boosted_listings")
            .select("id")
            .eq("property_id", propertyId)
            .eq("status", "active")
            .gte("expires_at", new Date().toISOString())
            .maybeSingle();

        return !!data;
    },

    // 📋 Get all active boosts for a user
    async getUserBoosts(userId: string): Promise<any[]> {
        const { data } = await supabase
            .from("boosted_listings")
            .select("*, properties(title)")
            .or(`agent_id.eq.${userId},landlord_id.eq.${userId}`)
            .eq("status", "active")
            .gte("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false });

        return data ?? [];
    },
};