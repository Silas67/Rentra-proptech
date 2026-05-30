/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/lib/supabase";

export type CommissionRecord = {
    id: string;
    agentId: string;
    propertyId?: string;
    bookingId?: string;
    tenantName?: string;
    propertyTitle?: string;
    dealValue?: number;
    agentCommission?: number;
    rentraCommission?: number;
    commissionRate: number;
    status: "pending" | "paid" | "disputed";
    createdAt: string;
};

const mapRecord = (r: Record<string, any>): CommissionRecord => ({
    id: r.id,
    agentId: r.agent_id,
    propertyId: r.property_id,
    bookingId: r.booking_id,
    tenantName: r.tenant_name,
    propertyTitle: r.property_title,
    dealValue: r.deal_value,
    agentCommission: r.agent_commission,
    rentraCommission: r.rentra_commission,
    commissionRate: r.commission_rate,
    status: r.status,
    createdAt: r.created_at,
});

export const commissionService = {

    // 📋 Get all commission records for an agent
    async getCommissions(agentId: string): Promise<CommissionRecord[]> {
        const { data, error } = await supabase
            .from("commission_records")
            .select("*")
            .eq("agent_id", agentId)
            .order("created_at", { ascending: false });

        if (error) return [];
        return (data ?? []).map(mapRecord);
    },

    // ➕ Log a closed deal for commission tracking
    async logDeal(payload: {
        agentId: string;
        propertyId: string;
        bookingId: string;
        tenantName: string;
        propertyTitle: string;
        dealValue: number;
        commissionRate?: number;
    }): Promise<CommissionRecord | null> {
        const rate = payload.commissionRate ?? 0.05;
        const agentCommission = payload.dealValue * 0.10; // 10% of deal
        const rentraCommission = agentCommission * rate;   // 5% of agent's commission

        const { data, error } = await supabase
            .from("commission_records")
            .insert({
                agent_id: payload.agentId,
                property_id: payload.propertyId,
                booking_id: payload.bookingId,
                tenant_name: payload.tenantName,
                property_title: payload.propertyTitle,
                deal_value: payload.dealValue,
                agent_commission: agentCommission,
                rentra_commission: rentraCommission,
                commission_rate: rate,
                status: "pending",
            })
            .select()
            .single();

        if (error || !data) return null;
        return mapRecord(data);
    },

    // 📊 Get commission summary for an agent
    async getSummary(agentId: string) {
        const records = await commissionService.getCommissions(agentId);

        const totalDeals = records.length;
        const totalEarned = records
            .filter((r) => r.status === "paid")
            .reduce((sum, r) => sum + (r.agentCommission ?? 0), 0);
        const totalOwedToRentra = records
            .filter((r) => r.status === "pending")
            .reduce((sum, r) => sum + (r.rentraCommission ?? 0), 0);
        const pendingDeals = records.filter((r) => r.status === "pending").length;

        return { totalDeals, totalEarned, totalOwedToRentra, pendingDeals, records };
    },
};