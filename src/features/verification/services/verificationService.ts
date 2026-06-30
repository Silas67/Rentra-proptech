/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/lib/supabase";
import {
  VerificationRequest,
  VerificationStatus,
  UploadedDocument,
  SurveyorReport,
  AgisSubmission,
  AgisResult,
  VerificationReport,
} from "@/features/verification/types";

export const mapVerificationRequest = (r: Record<string, any>): VerificationRequest => ({
  id: r.id,
  propertyId: r.property_id,
  status: r.status,
  createdBy: r.created_by,
  createdAt: r.created_at,
});

export const mapUploadedDocument = (d: Record<string, any>): UploadedDocument => ({
  id: d.id,
  requestId: d.request_id,
  fileUrl: d.file_url,
  docType: d.doc_type,
  extractedData: d.extracted_data ?? null,
  createdAt: d.created_at,
});

const mapSurveyorReport = (s: Record<string, any>): SurveyorReport => ({
  id: s.id,
  requestId: s.request_id,
  surveyorId: s.surveyor_id,
  findings: s.findings,
  submittedAt: s.submitted_at,
});

const mapAgisSubmission = (s: Record<string, any>): AgisSubmission => ({
  id: s.id,
  requestId: s.request_id,
  submittedBy: s.submitted_by,
  submittedAt: s.submitted_at,
  trackingRef: s.tracking_ref ?? null,
});

const mapAgisResult = (r: Record<string, any>): AgisResult => ({
  id: r.id,
  requestId: r.request_id,
  resultFileUrl: r.result_file_url,
  verdict: r.verdict,
  rawData: r.raw_data ?? null,
  uploadedAt: r.uploaded_at,
});

const mapVerificationReport = (r: Record<string, any>): VerificationReport => ({
  id: r.id,
  requestId: r.request_id,
  riskLevel: r.risk_level,
  verdict: r.verdict,
  reportPdfUrl: r.report_pdf_url ?? null,
  generatedAt: r.generated_at,
});

export const verificationService = {
  async getRequestByProperty(propertyId: string): Promise<VerificationRequest | null> {
    const { data, error } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("property_id", propertyId)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("getRequestByProperty error:", error);
      return null;
    }

    return mapVerificationRequest(data);
  },

  async getRequestById(requestId: string): Promise<VerificationRequest | null> {
    const { data, error } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("getRequestById error:", error);
      return null;
    }

    return mapVerificationRequest(data);
  },

  // Shared work queue for surveyor/lawyer dashboards — RLS scopes this to
  // staff roles plus the request creator/property owner, see
  // can_access_verification_request() in the RLS migration.
  async getStaffQueue(statuses?: VerificationStatus[]): Promise<VerificationRequest[]> {
    let query = supabase.from("verification_requests").select("*");

    if (statuses && statuses.length > 0) {
      query = query.in("status", statuses);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      console.error("getStaffQueue error:", error);
      return [];
    }

    return (data ?? []).map(mapVerificationRequest);
  },

  async getUploadedDocuments(requestId: string): Promise<UploadedDocument[]> {
    const { data, error } = await supabase
      .from("uploaded_documents")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("getUploadedDocuments error:", error);
      return [];
    }

    return (data ?? []).map(mapUploadedDocument);
  },

  async getSurveyorReport(requestId: string): Promise<SurveyorReport | null> {
    const { data, error } = await supabase
      .from("surveyor_reports")
      .select("*")
      .eq("request_id", requestId)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("getSurveyorReport error:", error);
      return null;
    }

    return mapSurveyorReport(data);
  },

  async getAgisSubmission(requestId: string): Promise<AgisSubmission | null> {
    const { data, error } = await supabase
      .from("agis_submissions")
      .select("*")
      .eq("request_id", requestId)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("getAgisSubmission error:", error);
      return null;
    }

    return mapAgisSubmission(data);
  },

  async getAgisResult(requestId: string): Promise<AgisResult | null> {
    const { data, error } = await supabase
      .from("agis_results")
      .select("*")
      .eq("request_id", requestId)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("getAgisResult error:", error);
      return null;
    }

    return mapAgisResult(data);
  },

  async getVerificationReport(requestId: string): Promise<VerificationReport | null> {
    const { data, error } = await supabase
      .from("verification_reports")
      .select("*")
      .eq("request_id", requestId)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("getVerificationReport error:", error);
      return null;
    }

    return mapVerificationReport(data);
  },
};
