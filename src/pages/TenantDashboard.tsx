import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/bookingService";
import { savedPropertyService } from "@/services/savedPropertyService";
import { propertyService } from "@/services/propertyService";
import { Booking, Property } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PropertyCard from "@/components/PropertyCard";
import {
  Calendar, Search, Home, Loader2, Clock,
  CheckCircle2, XCircle, Heart
} from "lucide-react";

const statusIcon = (status: Booking["status"]) => {
  switch (status) {
    case "confirmed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "cancelled": return <XCircle className="h-4 w-4 text-destructive" />;
    case "completed": return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
    default: return <Clock className="h-4 w-4 text-yellow-500" />;
  }
};

const statusVariant = (status: Booking["status"]) => {
  switch (status) {
    case "confirmed": return "default" as const;
    case "cancelled": return "destructive" as const;
    case "completed": return "secondary" as const;
    default: return "secondary" as const;
  }
};

const TenantDashboard = () => {
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingProperties, setBookingProperties] = useState<Record<string, Property>>({});
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Fetch bookings
  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      setLoadingBookings(true);
      const data = await bookingService.getTenantBookings(user.id);
      setBookings(data);
      setLoadingBookings(false);

      const propertyMap: Record<string, Property> = {};
      await Promise.all(
        data.map(async (b) => {
          const property = await propertyService.getPropertyById(b.propertyId);
          if (property) propertyMap[b.propertyId] = property;
        })
      );
      setBookingProperties(propertyMap);
    };

    fetch();
  }, [user]);

  // Fetch saved properties
  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      setLoadingSaved(true);
      const [saved, ids] = await Promise.all([
        savedPropertyService.getSavedProperties(user.id),
        savedPropertyService.getSavedPropertyIds(user.id),
      ]);
      setSavedProperties(saved);
      setSavedIds(ids);
      setLoadingSaved(false);
    };

    fetch();
  }, [user]);

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    const success = await bookingService.cancelBooking(bookingId);
    if (success) {
      setBookings((prev) =>
        prev.map((b) => b.id === bookingId ? { ...b, status: "cancelled" as const } : b)
      );
    }
    setCancellingId(null);
  };

  // Called when heart is toggled on a saved property card
  const handleSaveToggle = (propertyId: string, saved: boolean) => {
    if (!saved) {
      setSavedProperties((prev) => prev.filter((p) => p.id !== propertyId));
      setSavedIds((prev) => prev.filter((id) => id !== propertyId));
    }
  };

  const activeBookings = bookings.filter((b) => b.status === "pending" || b.status === "confirmed");
  const pastBookings = bookings.filter((b) => b.status === "completed" || b.status === "cancelled");

  return (
    <div className="min-h-screen pt-24 pb-6">
      <div className="container">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="font-sans text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name || "Tenant"}</p>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Link
            to="/listings"
            className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Browse Properties</p>
              <p className="text-sm text-muted-foreground">Find your next home</p>
            </div>
          </Link>
          <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">{activeBookings.length} Active Booking{activeBookings.length !== 1 ? "s" : ""}</p>
              <p className="text-sm text-muted-foreground">Upcoming inspections</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50">
              <Heart className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="font-semibold">{savedProperties.length} Saved</p>
              <p className="text-sm text-muted-foreground">Favourite properties</p>
            </div>
          </div>
        </div>

        {/* Upcoming Inspections */}
        <div className="mb-8">
          <h2 className="mb-4 font-display text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5" /> Upcoming Inspections
          </h2>

          {loadingBookings ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading bookings...
            </div>
          ) : activeBookings.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-12 text-center text-muted-foreground">
              <Calendar className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="font-medium">No upcoming inspections</p>
              <p className="text-sm mb-4">Browse properties and book an inspection</p>
              <Button asChild size="sm">
                <Link to="/listings">Browse Properties</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeBookings.map((b) => {
                const property = bookingProperties[b.propertyId];
                return (
                  <div key={b.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
                    {property?.images?.[0] ? (
                      <img src={property.images[0]} alt={property.title} className="h-20 w-28 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Home className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{property?.title ?? "Property"}</p>
                      <p className="text-sm text-muted-foreground">{property?.city}, {property?.state}</p>
                      <p className="text-sm text-muted-foreground">📅 {b.date} at {b.time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {statusIcon(b.status)}
                        <Badge variant={statusVariant(b.status)} className="capitalize">{b.status}</Badge>
                      </div>
                      {b.status === "pending" && (
                        <Button variant="outline" size="sm" onClick={() => handleCancel(b.id)} disabled={cancellingId === b.id}>
                          {cancellingId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Cancel"}
                        </Button>
                      )}
                      {property && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/property/${b.propertyId}`}>View</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Saved Properties */}
        <div className="mb-8">
          <h2 className="mb-4 font-display text-xl font-bold flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" /> Saved Properties
          </h2>

          {loadingSaved ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading saved properties...
            </div>
          ) : savedProperties.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-12 text-center text-muted-foreground">
              <Heart className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="font-medium">No saved properties yet</p>
              <p className="text-sm mb-4">Tap the heart on any listing to save it here</p>
              <Button asChild size="sm">
                <Link to="/listings">Browse Properties</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {savedProperties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  isSaved={savedIds.includes(p.id)}
                  onSaveToggle={handleSaveToggle}
                />
              ))}
            </div>
          )}
        </div>

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <div>
            <h2 className="mb-4 font-display text-xl font-bold text-muted-foreground">
              Past Inspections
            </h2>
            <div className="space-y-3">
              {pastBookings.map((b) => {
                const property = bookingProperties[b.propertyId];
                return (
                  <div key={b.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 opacity-60 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <p className="font-medium">{property?.title ?? "Property"}</p>
                      <p className="text-sm text-muted-foreground">{b.date} at {b.time}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {statusIcon(b.status)}
                      <Badge variant={statusVariant(b.status)} className="capitalize">{b.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TenantDashboard;
