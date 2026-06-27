/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/lib/supabase";
import { SiteInspection } from "@/lib/types";

const mapInspection = (i: Record<string, any>): SiteInspection => ({
  id: i.id,
  verificationId: i.verification_id,
  surveyorId: i.surveyor_id,
  inspectedAt: i.inspected_at,
  gpsLat: i.gps_lat ?? undefined,
  gpsLng: i.gps_lng ?? undefined,
  boundaryMatchesDocs: i.boundary_matches_docs ?? undefined,
  structureMatchesDocs: i.structure_matches_docs ?? undefined,
  encumbrancesObserved: i.encumbrances_observed ?? undefined,
  photos: i.photos ?? [],
  findings: i.findings ?? undefined,
  recommendation: i.recommendation ?? undefined,
  createdAt: i.created_at,
});

export type SubmitInspectionPayload = {
  verificationId: string;
  surveyorId: string;
  inspectedAt: string;
  gpsLat?: number;
  gpsLng?: number;
  boundaryMatchesDocs: boolean;
  structureMatchesDocs: boolean;
  encumbrancesObserved?: string;
  photos: string[];
  findings: string;
  recommendation: "proceed" | "flag" | "reject";
};

export const siteInspectionService = {

  // 📝 Surveyor logs the result of an offline site visit (one per verification)
  async submitInspection(payload: SubmitInspectionPayload): Promise<SiteInspection | null> {
    const { data, error } = await supabase
      .from("property_site_inspections")
      .upsert({
        verification_id: payload.verificationId,
        surveyor_id: payload.surveyorId,
        inspected_at: payload.inspectedAt,
        gps_lat: payload.gpsLat ?? null,
        gps_lng: payload.gpsLng ?? null,
        boundary_matches_docs: payload.boundaryMatchesDocs,
        structure_matches_docs: payload.structureMatchesDocs,
        encumbrances_observed: payload.encumbrancesObserved ?? null,
        photos: payload.photos,
        findings: payload.findings,
        recommendation: payload.recommendation,
      }, { onConflict: "verification_id" })
      .select()
      .single();

    if (error || !data) {
      console.error("submitInspection error:", error);
      return null;
    }

    await supabase
      .from("property_verifications")
      .update({ status: "pre_agis_ready" })
      .eq("id", payload.verificationId);

    return mapInspection(data);
  },

  async getInspection(verificationId: string): Promise<SiteInspection | null> {
    const { data, error } = await supabase
      .from("property_site_inspections")
      .select("*")
      .eq("verification_id", verificationId)
      .maybeSingle();

    if (error) {
      console.error("getInspection error:", error);
      return null;
    }

    return data ? mapInspection(data) : null;
  },
};
