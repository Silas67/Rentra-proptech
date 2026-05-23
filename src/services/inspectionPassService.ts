import { supabase } from "@/lib/supabase";

export const inspectionPassService = {

    async createPass(payload: {
        bookingId: string;
        tenantId: string;
        agentId: string;
        propertyId: string;
        amount: number;
        paystackReference: string;
    }) {
        const { data, error } = await supabase
            .from("inspection_passes")
            .insert({
                booking_id: payload.bookingId,
                tenant_id: payload.tenantId,
                agent_id: payload.agentId,
                property_id: payload.propertyId,
                amount: payload.amount,
                status: "paid",
                paystack_reference: payload.paystackReference,
                paid_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error("createPass error:", error);
            return null;
        }

        return data;
    },

    async getPassForBooking(bookingId: string) {
        const { data } = await supabase
            .from("inspection_passes")
            .select("*")
            .eq("booking_id", bookingId)
            .maybeSingle();

        return data;
    },
};