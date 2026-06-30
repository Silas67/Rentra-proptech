export type VerificationStatus =
  | "PENDING"
  | "DOCS_UPLOADED"
  | "AI_ANALYZED"
  | "SURVEY_DONE"
  | "PRE_REPORT_READY"
  | "AGIS_SUBMITTED"
  | "AGIS_RECEIVED"
  | "FINAL_REPORT_READY";

export type DocumentType =
  | "certificate_of_occupancy"
  | "right_of_occupancy"
  | "survey_plan"
  | "deed_of_assignment"
  | "governors_consent"
  | "building_approval_plan"
  | "tax_clearance_certificate"
  | "other";

export type AgisVerdict =
  | "clean_title"
  | "encumbrance"
  | "ownership_dispute"
  | "revoked";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface VerificationRequest {
  id: string;
  propertyId: string;
  status: VerificationStatus;
  createdBy: string;
  createdAt: string;
}

export interface UploadedDocument {
  id: string;
  requestId: string;
  fileUrl: string;
  docType: DocumentType;
  extractedData: Record<string, unknown> | null;
  createdAt: string;
}

export interface SurveyorReport {
  id: string;
  requestId: string;
  surveyorId: string;
  findings: Record<string, unknown>;
  submittedAt: string;
}

export interface AgisSubmission {
  id: string;
  requestId: string;
  submittedBy: string;
  submittedAt: string;
  trackingRef: string | null;
}

export interface AgisResult {
  id: string;
  requestId: string;
  resultFileUrl: string;
  verdict: AgisVerdict;
  rawData: Record<string, unknown> | null;
  uploadedAt: string;
}

export interface VerificationReport {
  id: string;
  requestId: string;
  riskLevel: RiskLevel;
  verdict: string;
  reportPdfUrl: string | null;
  generatedAt: string;
}
