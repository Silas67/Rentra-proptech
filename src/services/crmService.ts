/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/lib/supabase";

export type CRMStage = "new" | "contacted" | "inspection_booked" | "offer" | "closed" | "lost";

export type CRMLead = {
    id: string;
    agentId: string;
    propertyId?: string;
    tenantName: string;
    tenantPhone?: string;
    tenantEmail?: string;
    stage: CRMStage;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    // Joined
    propertyTitle?: string;
};

const mapLead = (l: Record<string, any>): CRMLead => ({
    id: l.id,
    agentId: l.agent_id,
    propertyId: l.property_id,
    tenantName: l.tenant_name,
    tenantPhone: l.tenant_phone,
    tenantEmail: l.tenant_email,
    stage: l.stage,
    notes: l.notes,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
    propertyTitle: l.properties?.title,
});

export const STAGE_CONFIG: Record<CRMStage, { label: string; color: string; bg: string }> = {
    new: { label: "New Lead", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    contacted: { label: "Contacted", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
    inspection_booked: { label: "Inspection Booked", color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
    offer: { label: "Offer Made", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
    closed: { label: "Closed", color: "text-green-600", bg: "bg-green-50 border-green-200" },
    lost: { label: "Lost", color: "text-muted-foreground", bg: "bg-muted border-border" },
};

export const STAGE_ORDER: CRMStage[] = ["new", "contacted", "inspection_booked", "offer", "closed", "lost"];

export const crmService = {

    // 📋 Get all leads for an agent
    async getLeads(agentId: string): Promise<CRMLead[]> {
        const { data, error } = await supabase
            .from("crm_leads")
            .select("*, properties(title)")
            .eq("agent_id", agentId)
            .order("updated_at", { ascending: false });

        if (error) {
            console.error("getLeads error:", error);
            return [];
        }

        return (data ?? []).map(mapLead);
    },

    // ➕ Create a new lead
    async createLead(payload: {
        agentId: string;
        propertyId?: string;
        tenantName: string;
        tenantPhone?: string;
        tenantEmail?: string;
        stage?: CRMStage;
        notes?: string;
    }): Promise<CRMLead | null> {
        const { data, error } = await supabase
            .from("crm_leads")
            .insert({
                agent_id: payload.agentId,
                property_id: payload.propertyId ?? null,
                tenant_name: payload.tenantName,
                tenant_phone: payload.tenantPhone ?? null,
                tenant_email: payload.tenantEmail ?? null,
                stage: payload.stage ?? "new",
                notes: payload.notes ?? null,
            })
            .select("*, properties(title)")
            .single();

        if (error || !data) {
            console.error("createLead error:", error);
            return null;
        }

        return mapLead(data);
    },

    // 🔄 Update lead stage
    async updateStage(id: string, stage: CRMStage): Promise<boolean> {
        const { error } = await supabase
            .from("crm_leads")
            .update({ stage, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            console.error("updateStage error:", error);
            return false;
        }
        return true;
    },

    // 📝 Update lead notes
    async updateNotes(id: string, notes: string): Promise<boolean> {
        const { error } = await supabase
            .from("crm_leads")
            .update({ notes, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            console.error("updateNotes error:", error);
            return false;
        }
        return true;
    },

    // 🗑️ Delete a lead
    async deleteLead(id: string): Promise<boolean> {
        const { error } = await supabase
            .from("crm_leads")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("deleteLead error:", error);
            return false;
        }
        return true;
    },

    // 🔁 Auto-create lead from booking (called when booking is attributed to agent)
    async createLeadFromBooking(payload: {
        agentId: string;
        propertyId: string;
        tenantName: string;
        tenantPhone: string;
        tenantEmail: string;
    }): Promise<void> {
        // Check if lead already exists for this tenant + property combo
        const { data: existing } = await supabase
            .from("crm_leads")
            .select("id")
            .eq("agent_id", payload.agentId)
            .eq("property_id", payload.propertyId)
            .eq("tenant_name", payload.tenantName)
            .maybeSingle();

        if (existing) return; // Already tracked

        await supabase.from("crm_leads").insert({
            agent_id: payload.agentId,
            property_id: payload.propertyId,
            tenant_name: payload.tenantName,
            tenant_phone: payload.tenantPhone,
            tenant_email: payload.tenantEmail,
            stage: "inspection_booked", // Auto-set to inspection booked since they just booked
        });
    },
};