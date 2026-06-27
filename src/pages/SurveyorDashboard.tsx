import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { verificationService } from "@/services/verificationService";
import { propertyService } from "@/services/propertyService";
import { PropertyVerification } from "@/lib/types";
import VerificationStatusBadge from "@/components/verification/VerificationStatusBadge";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardCheck } from "lucide-react";

const SurveyorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<(PropertyVerification & { propertyTitle: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const verifications = await verificationService.listForSurveyor(user.id);
      const withTitles = await Promise.all(
        verifications.map(async (v) => {
          const property = await propertyService.getPropertyById(v.propertyId);
          return { ...v, propertyTitle: property?.title ?? "Unknown property" };
        })
      );
      setItems(withTitles);
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container max-w-3xl">
        <h1 className="font-display text-2xl font-bold mb-1">Surveyor Dashboard</h1>
        <p className="text-muted-foreground mb-6">Properties assigned to you for site inspection</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center text-muted-foreground">
            <ClipboardCheck className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p className="font-medium">No inspections assigned yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
                <div>
                  <p className="font-medium">{v.propertyTitle}</p>
                  <VerificationStatusBadge status={v.status} />
                </div>
                <Button size="sm" onClick={() => navigate(`/property-verification/${v.propertyId}`)}>Open</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyorDashboard;
