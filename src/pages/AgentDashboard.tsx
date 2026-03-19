import { mockReferrals, mockProperties, mockBookings } from "@/lib/mock-data";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MousePointer, Eye, DollarSign, Link2, Copy, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AgentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const agentId = user?.id;

  const referrals = mockReferrals;

  const totalClicks = referrals.reduce((s, r) => s + r.clicks, 0);
  const totalInspections = referrals.reduce((s, r) => s + r.inspections, 0);
  const totalCommission = referrals.reduce((s, r) => s + r.commission, 0);

  const pendingBookings = mockBookings.filter(
    (b) => b.agentId === agentId && b.status === "pending"
  );

  const copyLink = async (code: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/search?ref=${code}`
      );

      toast({
        title: "Link copied",
        description: "Referral link copied to clipboard",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container">

        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-bold">Agent Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back {user?.name || "Agent"}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: MousePointer,
              label: "Total Clicks",
              value: totalClicks,
              color: "text-primary",
            },
            {
              icon: Eye,
              label: "Inspections",
              value: totalInspections,
              color: "text-secondary",
            },
            {
              icon: DollarSign,
              label: "Commission Earned",
              value: `₦${totalCommission.toLocaleString()}`,
              color: "text-success",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Referral Links */}
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
            <Link2 className="h-5 w-5" /> Your Referral Links
          </h2>

          <div className="space-y-3">
            {referrals.map((ref) => {
              const property = mockProperties.find(
                (p) => p.id === ref.propertyId
              );

              return (
                <div
                  key={ref.id}
                  className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {property?.title || "Unknown Property"}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {ref.referralCode} · {ref.clicks} clicks ·{" "}
                      {ref.inspections} inspections
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        ref.status === "converted" ? "default" : "secondary"
                      }
                    >
                      {ref.status}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyLink(ref.referralCode)}
                    >
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      Copy
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Bookings */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
            <TrendingUp className="h-5 w-5" /> Pending Inspections
          </h2>

          {pendingBookings.length > 0 ? (
            <div className="space-y-3">
              {pendingBookings.map((b) => {
                const property = mockProperties.find(
                  (p) => p.id === b.propertyId
                );

                return (
                  <div key={b.id} className="rounded-xl border bg-card p-4">
                    <p className="font-medium">
                      {property?.title || "Unknown Property"}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {b.tenantName} · {b.date} at {b.time}
                    </p>

                    <Badge variant="secondary" className="mt-2">
                      {b.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No pending inspections
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default AgentDashboard;