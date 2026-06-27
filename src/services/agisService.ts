/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/lib/supabase";
import { AgisSubmission } from "@/lib/types";

const mapSubmission = (s: Record<string, any>): AgisSubmission => ({
  id: s.id,
  verificationId: s.verification_id,
  submittedBy: s.submitted_by,
  agisReference: s.agis_reference ?? undefined,
  submittedAt: s.submitted_at,
  resultStatus: s.result_status,
  resultSummary: s.result_summary ?? undefined,
  resultReceivedAt: s.result_received_at ?? undefined,
  createdAt: s.created_at,
});

export const agisService = {

  // 📨 Lawyer logs that the AGIS request was manually filed
  async logSubmission(payload: {
    verificationId: string;
    submittedBy: string;
    agisReference?: string;
    submittedAt: string;
  }): Promise<AgisSubmission | null> {
    const { data, error } = await supabase
      .from("property_agis_submissions")
      .upsert({
        verification_id: payload.verificationId,
        submitted_by: payload.submittedBy,
        agis_reference: payload.agisReference ?? null,
        submitted_at: payload.submittedAt,
        result_status: "pending",
      }, { onConflict: "verification_id" })
      .select()
      .single();

    if (error || !data) {
      console.error("logSubmission error:", error);
      return null;
    }

    await supabase
      .from("property_verifications")
      .update({ status: "agis_submitted" })
      .eq("id", payload.verificationId);

    return mapSubmission(data);
  },

  // 📬 Lawyer records the official AGIS result once it comes back
  async recordResult(payload: {
    verificationId: string;
    resultStatus: AgisSubmission["resultStatus"];
    resultSummary: string;
    resultReceivedAt: string;
  }): Promise<boolean> {
    const { error } = await supabase
      .from("property_agis_submissions")
      .update({
        result_status: payload.resultStatus,
        result_summary: payload.resultSummary,
        result_received_at: payload.resultReceivedAt,
      })
      .eq("verification_id", payload.verificationId);

    if (error) {
      console.error("recordResult error:", error);
      return false;
    }

    await supabase
      .from("property_verifications")
      .update({ status: "agis_returned" })
      .eq("id", payload.verificationId);

    return true;
  },

  async getSubmission(verificationId: string): Promise<AgisSubmission | null> {
    const { data, error } = await supabase
      .from("property_agis_submissions")
      .select("*")
      .eq("verification_id", verificationId)
      .maybeSingle();

    if (error) {
      console.error("getSubmission error:", error);
      return null;
    }

    return data ? mapSubmission(data) : null;
  },
};
