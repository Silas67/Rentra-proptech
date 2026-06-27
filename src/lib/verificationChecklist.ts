import { VerificationDocType } from "@/lib/types";

export interface DocChecklistItem {
  docType: VerificationDocType;
  label: string;
  required: boolean;
  expectedFields: { key: string; label: string }[];
}

// Required documents + the fields a reviewer keys in after reading each one.
export const DOC_CHECKLIST: DocChecklistItem[] = [
  {
    docType: "title_deed",
    label: "Title Deed",
    required: true,
    expectedFields: [
      { key: "ownerName", label: "Registered owner" },
      { key: "parcelId", label: "Parcel / plot ID" },
      { key: "registrationDate", label: "Registration date" },
    ],
  },
  {
    docType: "survey_plan",
    label: "Survey Plan",
    required: true,
    expectedFields: [
      { key: "surveyPlanNumber", label: "Survey plan number" },
      { key: "landArea", label: "Land area (sqm)" },
      { key: "coordinates", label: "Beacon coordinates" },
    ],
  },
  {
    docType: "deed_of_assignment",
    label: "Deed of Assignment",
    required: true,
    expectedFields: [
      { key: "assignor", label: "Assignor" },
      { key: "assignee", label: "Assignee" },
      { key: "assignmentDate", label: "Date of assignment" },
    ],
  },
  {
    docType: "governors_consent",
    label: "Governor's Consent",
    required: false,
    expectedFields: [{ key: "consentReference", label: "Consent reference number" }],
  },
  {
    docType: "tax_clearance",
    label: "Land Use Charge / Tax Clearance",
    required: false,
    expectedFields: [{ key: "lastPaymentYear", label: "Last payment year" }],
  },
  {
    docType: "certificate_of_occupancy",
    label: "Certificate of Occupancy",
    required: false,
    expectedFields: [
      { key: "coNumber", label: "C of O number" },
      { key: "ownerName", label: "Registered owner" },
    ],
  },
];

export const REQUIRED_DOC_TYPES = DOC_CHECKLIST.filter((d) => d.required).map((d) => d.docType);

export const docLabel = (type: VerificationDocType) =>
  DOC_CHECKLIST.find((d) => d.docType === type)?.label ?? type;
