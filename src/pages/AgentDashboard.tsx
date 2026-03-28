import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/bookingService";
import { propertyService } from "@/services/propertyService";
import { Booking, Property } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MousePointer, Eye, DollarSign, Link2, Copy, TrendingUp, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusVariant = (status: Booking["status"]) => {
  switch (status) {
    case "confirmed": return "default";
    case "cancelled": return "destructive";
    case "completed": return "secondary";
    default: return "secondary";
  }
};

const AgentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch agent's bookings
  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      setLoadingBookings(true);
      const data = await bookingService.getAgentBookings(user.id);
      setBookings(data);
      setLoadingBookings(false);

      // Fetch property details for each unique property
      const uniquePropertyIds = [...new Set(data.map((b) => b.propertyId))];
      const propertyMap: Record<string, Property> = {};
      await Promise.all(
        uniquePropertyIds.map(async (pid) => {
          const property = await propertyService.getPropertyById(pid);
          if (property) propertyMap[pid] = property;
        })
      );
      setProperties(propertyMap);
    };

    fetch();
  }, [user]);

  const handleUpdateStatus = async (bookingId: string, status: Booking["status"]) => {
    setUpdatingId(bookingId);
    const success = await bookingService.updateBookingStatus(bookingId, status);
    if (success) {
      setBookings((prev) =>
        prev.map((b) => b.id === bookingId ? { ...b, status } : b)
      );
      toast({ title: `Inspection ${status}` });
    } else {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
    setUpdatingId(null);
  };

  const copyReferralLink = async (propertyId: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/property/${propertyId}?ref=${user?.id}`
      );
      toast({ title: "Referral link copied!" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const completedBookings = bookings.filter((b) => b.status === "completed");

  // Get unique assigned properties
  const assignedProperties = Object.values(properties);

  return (
    <div className="min-h-screen pt-24 pb-6">
      <div className="container">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-bold">Agent Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name || "Agent"}</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Clock, label: "Pending", value: pendingBookings.length, color: "text-yellow-500" },
            { icon: Eye, label: "Confirmed", value: confirmedBookings.length, color: "text-primary" },
            { icon: CheckCircle2, label: "Completed", value: completedBookings.length, color: "text-green-500" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
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

        {/* Assigned Properties & Referral Links */}
        {assignedProperties.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
              <Link2 className="h-5 w-5" /> Assigned Properties
            </h2>
            <div className="space-y-3">
              {assignedProperties.map((property) => (
                <div
                  key={property.id}
                  className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    {property.images?.[0] ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="h-14 w-20 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{property.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {property.city}, {property.state} · {property.currency}{property.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyReferralLink(property.id)}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    Copy Referral Link
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inspection Requests */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
            <TrendingUp className="h-5 w-5" /> Inspection Requests
          </h2>

          {loadingBookings ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading inspections...
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-12 text-center text-muted-foreground">
              <MousePointer className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="font-medium">No inspection requests yet</p>
              <p className="text-sm">Requests will appear here when tenants book viewings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const property = properties[b.propertyId];
                return (
                  <div key={b.id} className="rounded-xl border bg-card p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{property?.title ?? "Property"}</p>
                        <p className="text-sm text-muted-foreground">
                          {b.tenantName} · {b.tenantPhone}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          📅 {b.date} at {b.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant(b.status)} className="capitalize">
                          {b.status}
                        </Badge>
                        {b.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(b.id, "confirmed")}
                              disabled={updatingId === b.id}
                            >
                              {updatingId === b.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : "Confirm"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(b.id, "cancelled")}
                              disabled={updatingId === b.id}
                            >
                              Decline
                            </Button>
                          </>
                        )}
                        {b.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(b.id, "completed")}
                            disabled={updatingId === b.id}
                          >
                            {updatingId === b.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : "Mark Complete"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AgentDashboard;
