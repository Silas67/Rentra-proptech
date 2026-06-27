import { REQUIRED_DOC_TYPES, docLabel } from "@/lib/verificationChecklist";
import {
  AgisSubmission,
  FinalDecisionReport,
  PreAgisReport,
  SiteInspection,
  VerificationDocument,
} from "@/lib/types";
import { verificationService } from "@/services/verificationService";

// 🧮 Pure: cross-checks the owner name keyed in across every uploaded document
const findOwnerNameMismatches = (documents: VerificationDocument[]): string[] => {
  const names = documents
    .map((d) => d.extractedFields.ownerName?.trim().toLowerCase())
    .filter((n): n is string => !!n);

  const distinct = new Set(names);
  if (distinct.size <= 1) return [];

  return [`Owner name is inconsistent across documents: ${[...new Set(names)].join(" vs ")}`];
};

// 📋 Build the pre-AGIS report from whatever has been gathered so far
export const buildPreAgisReport = (
  documents: VerificationDocument[],
  inspection: SiteInspection | null
): PreAgisReport => {
  const uploadedTypes = new Set(documents.map((d) => d.docType));
  const missingDocTypes = REQUIRED_DOC_TYPES.filter((t) => !uploadedTypes.has(t));

  const fieldMismatches = findOwnerNameMismatches(documents);

  const riskFlags: string[] = [...fieldMismatches];
  if (inspection?.boundaryMatchesDocs === false) {
    riskFlags.push("Surveyor reports the physical boundary does not match the documents");
  }
  if (inspection?.structureMatchesDocs === false) {
    riskFlags.push("Surveyor reports the structure on site does not match the documents");
  }
  if (inspection?.encumbrancesObserved) {
    riskFlags.push(`Encumbrance observed on site: ${inspection.encumbrancesObserved}`);
  }
  if (inspection?.recommendation === "reject") {
    riskFlags.push("Surveyor recommends rejecting this listing");
  } else if (inspection?.recommendation === "flag") {
    riskFlags.push("Surveyor flagged this listing for further review");
  }

  let recommendation: PreAgisReport["recommendation"] = "ready_for_agis";
  if (missingDocTypes.length > 0) recommendation = "needs_more_docs";
  else if (riskFlags.length > 0) recommendation = "flagged";

  return {
    generatedAt: new Date().toISOString(),
    missingDocTypes,
    fieldMismatches,
    riskFlags,
    inspectionSummary: inspection?.findings,
    recommendation,
  };
};

// ⚖️ Combine the pre-AGIS findings with the official AGIS result into a decision
export const buildFinalDecisionReport = (
  preAgisReport: PreAgisReport,
  agisSubmission: AgisSubmission
): FinalDecisionReport => {
  const reasoning: string[] = [];
  let decision: FinalDecisionReport["decision"];

  if (agisSubmission.resultStatus === "rejected") {
    decision = "rejected";
    reasoning.push("AGIS rejected the title/parcel.");
  } else if (agisSubmission.resultStatus === "flagged") {
    decision = "requires_review";
    reasoning.push("AGIS flagged the title/parcel for further review.");
  } else if (agisSubmission.resultStatus === "clear") {
    if (preAgisReport.riskFlags.length > 0) {
      decision = "approved_with_conditions";
      reasoning.push("AGIS returned the title as clear, but pre-AGIS review raised concerns:", ...preAgisReport.riskFlags);
    } else {
      decision = "approved";
      reasoning.push("AGIS returned the title as clear and no pre-AGIS risk flags were raised.");
    }
  } else {
    decision = "requires_review";
    reasoning.push("AGIS result is still pending.");
  }

  if (agisSubmission.resultSummary) {
    reasoning.push(`AGIS summary: ${agisSubmission.resultSummary}`);
  }

  return {
    generatedAt: new Date().toISOString(),
    agisResultStatus: agisSubmission.resultStatus,
    preAgisFlags: preAgisReport.riskFlags,
    decision,
    reasoning,
  };
};

export const verificationReportService = {

  async generateAndSavePreAgisReport(
    verificationId: string,
    documents: VerificationDocument[],
    inspection: SiteInspection | null
  ): Promise<PreAgisReport> {
    const report = buildPreAgisReport(documents, inspection);
    await verificationService.savePreAgisReport(verificationId, report);
    return report;
  },

  async generateAndSaveFinalReport(
    verificationId: string,
    preAgisReport: PreAgisReport,
    agisSubmission: AgisSubmission
  ): Promise<FinalDecisionReport> {
    const report = buildFinalDecisionReport(preAgisReport, agisSubmission);
    await verificationService.saveFinalReport(verificationId, report);
    return report;
  },

  docLabel,
};
