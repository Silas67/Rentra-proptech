import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { propertyService } from "@/services/propertyService";
import { verificationService } from "@/services/verificationService";
import { verificationDocumentService } from "@/services/verificationDocumentService";
import { siteInspectionService } from "@/services/siteInspectionService";
import { agisService } from "@/services/agisService";
import { verificationReportService, buildPreAgisReport } from "@/services/verificationReportService";
import { DOC_CHECKLIST, REQUIRED_DOC_TYPES, docLabel } from "@/lib/verificationChecklist";
import {
  AgisSubmission,
  Property,
  PropertyVerification,
  SiteInspection,
  VerificationDocType,
  VerificationDocument,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import VerificationStatusBadge from "@/components/verification/VerificationStatusBadge";
import { Loader2, Upload, FileText, ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";

const VerificationDetail = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState<Property | null>(null);
  const [verification, setVerification] = useState<PropertyVerification | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [inspection, setInspection] = useState<SiteInspection | null>(null);
  const [agisSubmission, setAgisSubmission] = useState<AgisSubmission | null>(null);
  const [staff, setStaff] = useState<{ surveyors: { id: string; name: string }[]; lawyers: { id: string; name: string }[] }>({ surveyors: [], lawyers: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);

    const prop = await propertyService.getPropertyById(propertyId);
    setProperty(prop);

    let v = await verificationService.getByProperty(propertyId);
    if (!v && user && (role === "landlord" || role === "agent")) {
      v = await verificationService.startVerification(propertyId, user.id);
    }
    setVerification(v);

    if (v) {
      const [docs, insp, agis, surveyors, lawyers] = await Promise.all([
        verificationDocumentService.listDocuments(v.id),
        siteInspectionService.getInspection(v.id),
        agisService.getSubmission(v.id),
        verificationService.listStaff("surveyor"),
        verificationService.listStaff("lawyer"),
      ]);
      setDocuments(docs);
      setInspection(insp);
      setAgisSubmission(agis);
      setStaff({ surveyors, lawyers });
    }

    setLoading(false);
  }, [propertyId, user, role]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = !!user && (verification?.requestedBy === user.id || property?.landlordId === user.id || property?.agentId === user.id);
  const isSurveyor = !!user && verification?.assignedSurveyorId === user.id;
  const isLawyer = !!user && verification?.assignedLawyerId === user.id;

  // ── Document upload ────────────────────────────────────────────────────
  const handleUpload = async (docType: VerificationDocType, file: File) => {
    if (!verification || !user) return;
    setBusy(true);
    const url = await verificationDocumentService.uploadFile(verification.id, file);
    if (!url) {
      toast.error("Upload failed");
      setBusy(false);
      return;
    }
    const doc = await verificationDocumentService.addDocument({
      verificationId: verification.id,
      docType,
      fileUrl: url,
      fileName: file.name,
      uploadedBy: user.id,
    });
    if (doc) {
      setDocuments((prev) => [doc, ...prev]);
      toast.success(`${docLabel(docType)} uploaded`);
    }
    setBusy(false);
  };

  const handleFieldChange = (doc: VerificationDocument, key: string, value: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, extractedFields: { ...d.extractedFields, [key]: value } } : d))
    );
  };

  const saveFields = async (doc: VerificationDocument) => {
    setBusy(true);
    await verificationDocumentService.updateExtractedFields(doc.id, doc.extractedFields);
    toast.success("Saved");
    setBusy(false);
  };

  // ── Stage transitions ──────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!verification) return;
    const uploadedTypes = new Set(documents.map((d) => d.docType));
    const missing = REQUIRED_DOC_TYPES.filter((t) => !uploadedTypes.has(t));
    if (missing.length > 0) {
      toast.error(`Still missing: ${missing.map(docLabel).join(", ")}`);
      return;
    }
    setBusy(true);
    await verificationService.setStatus(verification.id, "awaiting_inspection");
    setVerification({ ...verification, status: "awaiting_inspection" });
    toast.success("Documents analyzed — ready for site inspection");
    setBusy(false);
  };

  const handleAssign = async (field: "surveyorId" | "lawyerId", id: string) => {
    if (!verification) return;
    setBusy(true);
    await verificationService.assignStaff(verification.id, { [field]: id || undefined });
    setVerification({
      ...verification,
      ...(field === "surveyorId" ? { assignedSurveyorId: id || undefined } : { assignedLawyerId: id || undefined }),
    });
    setBusy(false);
  };

  const handleGeneratePreAgis = async () => {
    if (!verification) return;
    setBusy(true);
    const report = await verificationReportService.generateAndSavePreAgisReport(verification.id, documents, inspection);
    setVerification({ ...verification, preAgisReport: report, status: "pre_agis_ready" });
    toast.success("Pre-AGIS report generated");
    setBusy(false);
  };

  const handleGenerateFinal = async () => {
    if (!verification || !verification.preAgisReport || !agisSubmission) return;
    setBusy(true);
    const report = await verificationReportService.generateAndSaveFinalReport(verification.id, verification.preAgisReport, agisSubmission);
    setVerification({ ...verification, finalReport: report, status: "completed" });
    toast.success("Final decision report generated");
    setBusy(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!property) {
    return <div className="py-24 text-center text-muted-foreground">Property not found</div>;
  }

  if (!verification) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        No verification has been started for this property yet.
      </div>
    );
  }

  const uploadedTypes = new Set(documents.map((d) => d.docType));
  const livePreAgis = buildPreAgisReport(documents, inspection);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container max-w-4xl space-y-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Verification — {property.title}</h1>
            <p className="text-muted-foreground text-sm">{property.address}, {property.city}, {property.state}</p>
          </div>
          <VerificationStatusBadge status={verification.status} />
        </div>

        {/* Assignment */}
        {isOwner && (
          <div className="rounded-xl border bg-card p-4 grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Assigned Surveyor</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={verification.assignedSurveyorId ?? ""}
                onChange={(e) => handleAssign("surveyorId", e.target.value)}
              >
                <option value="">Unassigned</option>
                {staff.surveyors.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Assigned Lawyer</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={verification.assignedLawyerId ?? ""}
                onChange={(e) => handleAssign("lawyerId", e.target.value)}
              >
                <option value="">Unassigned</option>
                {staff.lawyers.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <Tabs defaultValue="documents">
          <TabsList>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="inspection">Site Inspection</TabsTrigger>
            <TabsTrigger value="agis">AGIS</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* ── Documents ──────────────────────────────────────────────── */}
          <TabsContent value="documents" className="space-y-4 pt-4">
            {DOC_CHECKLIST.map((item) => {
              const doc = documents.find((d) => d.docType === item.docType);
              return (
                <div key={item.docType} className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium flex items-center gap-2">
                      {uploadedTypes.has(item.docType)
                        ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                        : <FileText className="h-4 w-4 text-muted-foreground" />}
                      {item.label}
                      {item.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                    </p>
                    {isOwner && (
                      <label className="flex items-center gap-1.5 text-sm text-primary hover:underline cursor-pointer">
                        <Upload className="h-3.5 w-3.5" />
                        {doc ? "Replace" : "Upload"}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          disabled={busy}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUpload(item.docType, f);
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {doc && (
                    <div className="space-y-2">
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                        {doc.fileName ?? "View file"}
                      </a>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {item.expectedFields.map((f) => (
                          <Input
                            key={f.key}
                            placeholder={f.label}
                            value={doc.extractedFields[f.key] ?? ""}
                            onChange={(e) => handleFieldChange(doc, f.key, e.target.value)}
                          />
                        ))}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => saveFields(doc)} disabled={busy}>
                        Save extracted fields
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            {isOwner && verification.status === "documents_pending" && (
              <Button onClick={handleAnalyze} disabled={busy} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Analyze Documents
              </Button>
            )}
          </TabsContent>

          {/* ── Inspection ─────────────────────────────────────────────── */}
          <TabsContent value="inspection" className="pt-4">
            <InspectionPanel
              verification={verification}
              inspection={inspection}
              canEdit={isSurveyor}
              onSubmitted={(insp) => {
                setInspection(insp);
                setVerification({ ...verification, status: "pre_agis_ready" });
              }}
            />
          </TabsContent>

          {/* ── AGIS ───────────────────────────────────────────────────── */}
          <TabsContent value="agis" className="pt-4">
            <AgisPanel
              verification={verification}
              submission={agisSubmission}
              canEdit={isLawyer}
              onSubmissionLogged={(sub) => {
                setAgisSubmission(sub);
                setVerification({ ...verification, status: "agis_submitted" });
              }}
              onResultRecorded={(sub) => {
                setAgisSubmission(sub);
                setVerification({ ...verification, status: "agis_returned" });
              }}
            />
          </TabsContent>

          {/* ── Reports ────────────────────────────────────────────────── */}
          <TabsContent value="reports" className="pt-4 space-y-4">
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h3 className="font-semibold">Pre-AGIS Report</h3>
              {verification.preAgisReport ? (
                <ReportSummary
                  recommendation={verification.preAgisReport.recommendation}
                  flags={verification.preAgisReport.riskFlags}
                  missing={verification.preAgisReport.missingDocTypes.map(docLabel)}
                />
              ) : (
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Preview (not yet saved):</p>
                  <ReportSummary
                    recommendation={livePreAgis.recommendation}
                    flags={livePreAgis.riskFlags}
                    missing={livePreAgis.missingDocTypes.map(docLabel)}
                  />
                </div>
              )}
              {isOwner && verification.status === "awaiting_inspection" && inspection && !verification.preAgisReport && (
                <Button onClick={handleGeneratePreAgis} disabled={busy}>Generate Pre-AGIS Report</Button>
              )}
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h3 className="font-semibold">Final Decision Report</h3>
              {verification.finalReport ? (
                <div className="space-y-2 text-sm">
                  <Badge>{verification.finalReport.decision.replace(/_/g, " ")}</Badge>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    {verification.finalReport.reasoning.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not yet generated — requires the AGIS result first.</p>
              )}
              {isOwner && verification.status === "agis_returned" && !verification.finalReport && (
                <Button onClick={handleGenerateFinal} disabled={busy}>Generate Final Decision Report</Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const ReportSummary = ({ recommendation, flags, missing }: { recommendation: string; flags: string[]; missing: string[] }) => (
  <div className="space-y-2 text-sm">
    <Badge variant={recommendation === "ready_for_agis" ? "default" : "secondary"}>{recommendation.replace(/_/g, " ")}</Badge>
    {missing.length > 0 && (
      <p className="flex items-start gap-1.5 text-yellow-600"><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> Missing: {missing.join(", ")}</p>
    )}
    {flags.length > 0 && (
      <ul className="list-disc pl-5 text-muted-foreground">
        {flags.map((f, i) => <li key={i}>{f}</li>)}
      </ul>
    )}
    {missing.length === 0 && flags.length === 0 && <p className="text-muted-foreground">No issues found.</p>}
  </div>
);

// ── Inspection panel ─────────────────────────────────────────────────────
const InspectionPanel = ({
  verification, inspection, canEdit, onSubmitted,
}: {
  verification: PropertyVerification;
  inspection: SiteInspection | null;
  canEdit: boolean;
  onSubmitted: (i: SiteInspection) => void;
}) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    inspectedAt: inspection?.inspectedAt ?? new Date().toISOString().slice(0, 10),
    gpsLat: inspection?.gpsLat?.toString() ?? "",
    gpsLng: inspection?.gpsLng?.toString() ?? "",
    boundaryMatchesDocs: inspection?.boundaryMatchesDocs ?? true,
    structureMatchesDocs: inspection?.structureMatchesDocs ?? true,
    encumbrancesObserved: inspection?.encumbrancesObserved ?? "",
    findings: inspection?.findings ?? "",
    recommendation: inspection?.recommendation ?? "proceed",
  });
  const [busy, setBusy] = useState(false);

  if (inspection) {
    return (
      <div className="rounded-xl border bg-card p-4 space-y-2 text-sm">
        <p className="font-medium">Inspected on {inspection.inspectedAt}</p>
        <p>Boundary matches docs: {inspection.boundaryMatchesDocs ? "Yes" : "No"}</p>
        <p>Structure matches docs: {inspection.structureMatchesDocs ? "Yes" : "No"}</p>
        {inspection.encumbrancesObserved && <p>Encumbrances: {inspection.encumbrancesObserved}</p>}
        <p>Findings: {inspection.findings}</p>
        <Badge>{inspection.recommendation}</Badge>
      </div>
    );
  }

  if (!canEdit) {
    return <p className="text-sm text-muted-foreground">Waiting on the assigned surveyor to log their site inspection.</p>;
  }

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    const result = await siteInspectionService.submitInspection({
      verificationId: verification.id,
      surveyorId: user.id,
      inspectedAt: form.inspectedAt,
      gpsLat: form.gpsLat ? Number(form.gpsLat) : undefined,
      gpsLng: form.gpsLng ? Number(form.gpsLng) : undefined,
      boundaryMatchesDocs: form.boundaryMatchesDocs,
      structureMatchesDocs: form.structureMatchesDocs,
      encumbrancesObserved: form.encumbrancesObserved || undefined,
      photos: [],
      findings: form.findings,
      recommendation: form.recommendation as "proceed" | "flag" | "reject",
    });
    if (result) {
      toast.success("Inspection logged");
      onSubmitted(result);
    } else {
      toast.error("Failed to log inspection");
    }
    setBusy(false);
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <p className="text-sm text-muted-foreground">Log the results of your offline site visit.</p>
      <Input type="date" value={form.inspectedAt} onChange={(e) => setForm((p) => ({ ...p, inspectedAt: e.target.value }))} />
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="GPS latitude" value={form.gpsLat} onChange={(e) => setForm((p) => ({ ...p, gpsLat: e.target.value }))} />
        <Input placeholder="GPS longitude" value={form.gpsLng} onChange={(e) => setForm((p) => ({ ...p, gpsLng: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.boundaryMatchesDocs} onChange={(e) => setForm((p) => ({ ...p, boundaryMatchesDocs: e.target.checked }))} />
          Boundary matches documents
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.structureMatchesDocs} onChange={(e) => setForm((p) => ({ ...p, structureMatchesDocs: e.target.checked }))} />
          Structure matches documents
        </label>
      </div>
      <Textarea placeholder="Encumbrances observed (if any)" value={form.encumbrancesObserved} onChange={(e) => setForm((p) => ({ ...p, encumbrancesObserved: e.target.value }))} />
      <Textarea placeholder="Findings" value={form.findings} onChange={(e) => setForm((p) => ({ ...p, findings: e.target.value }))} />
      <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.recommendation} onChange={(e) => setForm((p) => ({ ...p, recommendation: e.target.value as "proceed" | "flag" | "reject" }))}>
        <option value="proceed">Proceed</option>
        <option value="flag">Flag for review</option>
        <option value="reject">Reject</option>
      </select>
      <Button onClick={submit} disabled={busy} className="w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Submit Inspection
      </Button>
    </div>
  );
};

// ── AGIS panel ────────────────────────────────────────────────────────────
const AgisPanel = ({
  verification, submission, canEdit, onSubmissionLogged, onResultRecorded,
}: {
  verification: PropertyVerification;
  submission: AgisSubmission | null;
  canEdit: boolean;
  onSubmissionLogged: (s: AgisSubmission) => void;
  onResultRecorded: (s: AgisSubmission) => void;
}) => {
  const { user } = useAuth();
  const [reference, setReference] = useState("");
  const [submittedAt, setSubmittedAt] = useState(new Date().toISOString().slice(0, 10));
  const [resultStatus, setResultStatus] = useState<AgisSubmission["resultStatus"]>("clear");
  const [resultSummary, setResultSummary] = useState("");
  const [resultReceivedAt, setResultReceivedAt] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  if (!canEdit && !submission) {
    return <p className="text-sm text-muted-foreground">Waiting on the assigned lawyer to file the manual AGIS request.</p>;
  }

  const logSubmission = async () => {
    if (!user) return;
    setBusy(true);
    const result = await agisService.logSubmission({
      verificationId: verification.id,
      submittedBy: user.id,
      agisReference: reference || undefined,
      submittedAt,
    });
    if (result) {
      toast.success("AGIS submission logged");
      onSubmissionLogged(result);
    } else {
      toast.error("Failed to log AGIS submission");
    }
    setBusy(false);
  };

  const recordResult = async () => {
    setBusy(true);
    const ok = await agisService.recordResult({
      verificationId: verification.id,
      resultStatus,
      resultSummary,
      resultReceivedAt,
    });
    if (ok && submission) {
      toast.success("AGIS result recorded");
      onResultRecorded({ ...submission, resultStatus, resultSummary, resultReceivedAt });
    } else {
      toast.error("Failed to record AGIS result");
    }
    setBusy(false);
  };

  if (!submission) {
    return (
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <p className="text-sm text-muted-foreground">Log that the AGIS request has been manually filed at the registry.</p>
        <Input placeholder="AGIS reference number (optional)" value={reference} onChange={(e) => setReference(e.target.value)} />
        <Input type="date" value={submittedAt} onChange={(e) => setSubmittedAt(e.target.value)} />
        <Button onClick={logSubmission} disabled={busy} className="w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Log AGIS Submission
        </Button>
      </div>
    );
  }

  if (submission.resultStatus === "pending") {
    return (
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <p className="text-sm">Submitted {submission.submittedAt}{submission.agisReference ? ` · Ref ${submission.agisReference}` : ""}</p>
        {canEdit ? (
          <>
            <p className="text-sm text-muted-foreground">Record the official result once AGIS returns it.</p>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={resultStatus} onChange={(e) => setResultStatus(e.target.value as AgisSubmission["resultStatus"])}>
              <option value="clear">Clear</option>
              <option value="flagged">Flagged</option>
              <option value="rejected">Rejected</option>
            </select>
            <Textarea placeholder="Result summary" value={resultSummary} onChange={(e) => setResultSummary(e.target.value)} />
            <Input type="date" value={resultReceivedAt} onChange={(e) => setResultReceivedAt(e.target.value)} />
            <Button onClick={recordResult} disabled={busy} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Record AGIS Result
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Awaiting the official AGIS result.</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-2 text-sm">
      <p>Submitted {submission.submittedAt}{submission.agisReference ? ` · Ref ${submission.agisReference}` : ""}</p>
      <Badge>{submission.resultStatus}</Badge>
      <p className="text-muted-foreground">{submission.resultSummary}</p>
      <p className="text-xs text-muted-foreground">Result received {submission.resultReceivedAt}</p>
    </div>
  );
};

export default VerificationDetail;
