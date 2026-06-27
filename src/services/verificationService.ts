/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/lib/supabase";
import { PropertyVerification, VerificationStatus } from "@/lib/types";

const mapVerification = (v: Record<string, any>): PropertyVerification => ({
  id: v.id,
  propertyId: v.property_id,
  requestedBy: v.requested_by,
  assignedSurveyorId: v.assigned_surveyor_id ?? undefined,
  assignedLawyerId: v.assigned_lawyer_id ?? undefined,
  status: v.status,
  preAgisReport: v.pre_agis_report ?? undefined,
  finalReport: v.final_report ?? undefined,
  createdAt: v.created_at,
  updatedAt: v.updated_at,
});

export const verificationService = {

  // ➕ Start a verification for a property (idempotent — returns existing if present)
  async startVerification(propertyId: string, requestedBy: string): Promise<PropertyVerification | null> {
    const existing = await verificationService.getByProperty(propertyId);
    if (existing) return existing;

    const { data, error } = await supabase
      .from("property_verifications")
      .insert({ property_id: propertyId, requested_by: requestedBy })
      .select()
      .single();

    if (error || !data) {
      console.error("startVerification error:", error);
      return null;
    }

    return mapVerification(data);
  },

  async getByProperty(propertyId: string): Promise<PropertyVerification | null> {
    const { data, error } = await supabase
      .from("property_verifications")
      .select("*")
      .eq("property_id", propertyId)
      .maybeSingle();

    if (error) {
      console.error("getByProperty error:", error);
      return null;
    }

    return data ? mapVerification(data) : null;
  },

  async getById(id: string): Promise<PropertyVerification | null> {
    const { data, error } = await supabase
      .from("property_verifications")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("getById error:", error);
      return null;
    }

    return data ? mapVerification(data) : null;
  },

  async listForSurveyor(surveyorId: string): Promise<PropertyVerification[]> {
    const { data, error } = await supabase
      .from("property_verifications")
      .select("*")
      .eq("assigned_surveyor_id", surveyorId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("listForSurveyor error:", error);
      return [];
    }

    return (data ?? []).map(mapVerification);
  },

  async listForLawyer(lawyerId: string): Promise<PropertyVerification[]> {
    const { data, error } = await supabase
      .from("property_verifications")
      .select("*")
      .eq("assigned_lawyer_id", lawyerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("listForLawyer error:", error);
      return [];
    }

    return (data ?? []).map(mapVerification);
  },

  async assignStaff(id: string, fields: { surveyorId?: string; lawyerId?: string }): Promise<boolean> {
    const { error } = await supabase
      .from("property_verifications")
      .update({
        ...(fields.surveyorId !== undefined && { assigned_surveyor_id: fields.surveyorId }),
        ...(fields.lawyerId !== undefined && { assigned_lawyer_id: fields.lawyerId }),
      })
      .eq("id", id);

    if (error) {
      console.error("assignStaff error:", error);
      return false;
    }

    return true;
  },

  async setStatus(id: string, status: VerificationStatus): Promise<boolean> {
    const { error } = await supabase
      .from("property_verifications")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("setStatus error:", error);
      return false;
    }

    return true;
  },

  async savePreAgisReport(id: string, report: PropertyVerification["preAgisReport"]): Promise<boolean> {
    const { error } = await supabase
      .from("property_verifications")
      .update({ pre_agis_report: report, status: "pre_agis_ready" satisfies VerificationStatus })
      .eq("id", id);

    if (error) {
      console.error("savePreAgisReport error:", error);
      return false;
    }

    return true;
  },

  async saveFinalReport(id: string, report: PropertyVerification["finalReport"]): Promise<boolean> {
    const { error } = await supabase
      .from("property_verifications")
      .update({ final_report: report, status: "completed" satisfies VerificationStatus })
      .eq("id", id);

    if (error) {
      console.error("saveFinalReport error:", error);
      return false;
    }

    return true;
  },

  // 👷 Staff directory for assignment dropdowns
  async listStaff(role: "surveyor" | "lawyer"): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("role", role);

    if (error) {
      console.error("listStaff error:", error);
      return [];
    }

    return data ?? [];
  },
};
