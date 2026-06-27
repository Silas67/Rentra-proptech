import { Badge } from "@/components/ui/badge";
import { VerificationStatus } from "@/lib/types";

const STATUS_LABEL: Record<VerificationStatus, string> = {
  documents_pending: "Documents Pending",
  under_analysis: "Under Analysis",
  awaiting_inspection: "Awaiting Inspection",
  pre_agis_ready: "Pre-AGIS Ready",
  agis_submitted: "AGIS Submitted",
  agis_returned: "AGIS Returned",
  completed: "Completed",
};

const STATUS_VARIANT: Record<VerificationStatus, "default" | "secondary" | "destructive" | "outline"> = {
  documents_pending: "outline",
  under_analysis: "secondary",
  awaiting_inspection: "secondary",
  pre_agis_ready: "default",
  agis_submitted: "secondary",
  agis_returned: "secondary",
  completed: "default",
};

const VerificationStatusBadge = ({ status }: { status: VerificationStatus }) => (
  <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
);

export default VerificationStatusBadge;
