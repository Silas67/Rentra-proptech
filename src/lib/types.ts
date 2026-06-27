export type UserRole = "tenant" | "agent" | "landlord" | "surveyor" | "lawyer";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  referralCode?: string; // agents only
  createdAt: string;
}

export interface Property {

  id: string;
  title: string;
  description: string;
  listingType: "rent" | "sale";
  price: number;
  currency: string;
  location: string;
  city: string;
  state: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  hasGenerator?: boolean;
  hasWater?: boolean;
  hasSecurity?: boolean;
  powerHours?: number;
  lastVerifiedAt?: string;
  type: "apartment" | "house" | "studio" | "duplex";
  status: "available" | "rented" | "sold" | "pending";
  verificationTier?: "self_listed" | "agent_verified" | "rentra_verified";
  agencyFee?: number; // percentage e.g. 10 means 10%
  agentPhone?: string
  images: string[];
  landlordId: string;
  agentId?: string;
  isBoosted?: boolean;
  floorPlanUrl?: string;
  boostExpiresAt?: string;
  amenities: string[];
  createdAt: string;
}

export interface Referral {
  id: string;
  agentId: string;
  propertyId: string;
  referralCode: string;
  clicks: number;
  inspections: number;
  commission: number;
  status: "active" | "converted" | "expired";
  createdAt: string;
}

// ─── Property/land verification pipeline ───────────────────────────────────

export type VerificationStatus =
  | "documents_pending"
  | "under_analysis"
  | "awaiting_inspection"
  | "pre_agis_ready"
  | "agis_submitted"
  | "agis_returned"
  | "completed";

export type VerificationDocType =
  | "title_deed"
  | "survey_plan"
  | "deed_of_assignment"
  | "governors_consent"
  | "tax_clearance"
  | "certificate_of_occupancy"
  | "other";

export interface VerificationDocument {
  id: string;
  verificationId: string;
  docType: VerificationDocType;
  fileUrl: string;
  fileName?: string;
  uploadedBy: string;
  extractedFields: Record<string, string>;
  notes?: string;
  createdAt: string;
}

export interface SiteInspection {
  id: string;
  verificationId: string;
  surveyorId: string;
  inspectedAt: string;
  gpsLat?: number;
  gpsLng?: number;
  boundaryMatchesDocs?: boolean;
  structureMatchesDocs?: boolean;
  encumbrancesObserved?: string;
  photos: string[];
  findings?: string;
  recommendation?: "proceed" | "flag" | "reject";
  createdAt: string;
}

export interface AgisSubmission {
  id: string;
  verificationId: string;
  submittedBy: string;
  agisReference?: string;
  submittedAt: string;
  resultStatus: "pending" | "clear" | "flagged" | "rejected";
  resultSummary?: string;
  resultReceivedAt?: string;
  createdAt: string;
}

export interface PreAgisReport {
  generatedAt: string;
  missingDocTypes: VerificationDocType[];
  fieldMismatches: string[];
  riskFlags: string[];
  inspectionSummary?: string;
  recommendation: "ready_for_agis" | "needs_more_docs" | "flagged";
}

export interface FinalDecisionReport {
  generatedAt: string;
  agisResultStatus: AgisSubmission["resultStatus"];
  preAgisFlags: string[];
  inspectionRecommendation?: SiteInspection["recommendation"];
  decision: "approved" | "approved_with_conditions" | "rejected" | "requires_review";
  reasoning: string[];
}

export interface PropertyVerification {
  id: string;
  propertyId: string;
  requestedBy: string;
  assignedSurveyorId?: string;
  assignedLawyerId?: string;
  status: VerificationStatus;
  preAgisReport?: PreAgisReport;
  finalReport?: FinalDecisionReport;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  tenantId: string;
  agentId?: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  createdAt: string;
}
