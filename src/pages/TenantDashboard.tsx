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
  Calendar, Search, Home, Loader2, Clock, CheckCircle2, XCircle, Heart,
  ShieldCheck
} from "lucide-react";
import { savedSearchService, SavedSearch } from "@/services/savedSearchService";
import { Bell, BellOff, Bookmark, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "recharts";


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
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loadingSearches, setLoadingSearches] = useState(true);
  type KYCStatus = "none" | "pending" | "verified" | "rejected";
  const [kycStatus, setKycStatus] = useState<KYCStatus>("none");
  const [loadingKyc, setLoadingKyc] = useState(true);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycForm, setKycForm] = useState({
    idType: "nin",
    idNumber: "",
    fullName: "",
    employmentStatus: "employed",
    monthlyIncome: "",
  });




  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      setLoadingBookings(true);
      setLoadingSaved(true);
      setLoadingSearches(true);

      const [bookingsData, savedPropertiesData, savedIdsData, searchesData] = await Promise.all([
        bookingService.getTenantBookings(user.id),
        savedPropertyService.getSavedProperties(user.id),
        savedPropertyService.getSavedPropertyIds(user.id),
        savedSearchService.getSavedSearches(user.id),
      ]);

      setBookings(bookingsData);
      setSavedProperties(savedPropertiesData);
      setSavedIds(savedIdsData);
      setSavedSearches(searchesData);

      setLoadingBookings(false);
      setLoadingSaved(false);
      setLoadingSearches(false);

      // Fetch property details for bookings
      const propertyMap: Record<string, Property> = {};
      await Promise.all(
        bookingsData.map(async (b) => {
          const property = await propertyService.getPropertyById(b.propertyId);
          if (property) propertyMap[b.propertyId] = property;
        })
      );
      setBookingProperties(propertyMap);
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

  const handleSubmitKyc = async () => {
    if (!user || !kycForm.idNumber || !kycForm.fullName) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmittingKyc(true);

    const { error } = await supabase
      .from("tenant_verifications")
      .upsert({
        tenant_id: user.id,
        id_type: kycForm.idType,
        id_number: kycForm.idNumber,
        full_name: kycForm.fullName,
        employment_status: kycForm.employmentStatus,
        monthly_income: kycForm.monthlyIncome || null,
        status: "pending",
      });

    setSubmittingKyc(false);

    if (error) {
      toast.error("Failed to submit verification");
      return;
    }

    setKycStatus("pending");
    toast.success("Identity submitted! We'll verify within 48 hours ✓");
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

        {/* Saved Searches */}
        <div className="mb-8">
          <h2 className="mb-4 font-display text-xl font-bold flex items-center gap-2">
            <Bookmark className="h-5 w-5" /> Saved Searches
          </h2>

          {loadingSearches ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
            </div>
          ) : savedSearches.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
              <Bookmark className="mx-auto mb-3 h-8 w-8 opacity-30" />
              <p className="font-medium">No saved searches</p>
              <p className="text-sm">Save a search on the listings page to get alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedSearches.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
                  <div>
                    <p className="font-medium text-sm">{s.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.alertEnabled ? "🔔 Alerts on" : "🔕 Alerts off"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await savedSearchService.toggleAlert(s.id, !s.alertEnabled);
                        setSavedSearches((prev) =>
                          prev.map((search) =>
                            search.id === s.id
                              ? { ...search, alertEnabled: !search.alertEnabled }
                              : search
                          )
                        );
                      }}
                    >
                      {s.alertEnabled
                        ? <Bell className="h-4 w-4 text-primary" />
                        : <BellOff className="h-4 w-4 text-muted-foreground" />
                      }
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await savedSearchService.deleteSearch(s.id);
                        setSavedSearches((prev) => prev.filter((search) => search.id !== s.id));
                        toast.success("Search removed");
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tenant KYC */}
        <div className="mb-8">
          <h2 className="mb-4 font-display text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Identity Verification
          </h2>

          {loadingKyc ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
            </div>
          ) : kycStatus === "verified" ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <ShieldCheck className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-800">Identity Verified</h3>
              <p className="text-sm text-green-700">
                Landlords can see your verified status when you book their properties.
              </p>
            </div>
          ) : kycStatus === "pending" ? (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
                <Clock className="h-7 w-7 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-yellow-800">Verification Under Review</h3>
              <p className="text-sm text-yellow-700">We're reviewing your details. This takes up to 48 hours.</p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-6 space-y-4">
              {/* Why verify */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
                <p className="font-semibold">Why verify your identity?</p>
                {[
                  "Landlords trust verified tenants more",
                  "Skip the manual document submission at viewing",
                  "Get faster approval on rental applications",
                ].map((b) => (
                  <div key={b} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />{b}
                  </div>
                ))}
              </div>

              {/* Form */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Full Name (as on ID) *</Label>
                  <Input
                    placeholder="Your legal full name"
                    value={kycForm.fullName}
                    onChange={(e) => setKycForm((p) => ({ ...p, fullName: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>ID Type *</Label>
                    <select
                      value={kycForm.idType}
                      onChange={(e) => setKycForm((p) => ({ ...p, idType: e.target.value }))}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="nin">NIN</option>
                      <option value="bvn">BVN</option>
                      <option value="passport">Passport</option>
                      <option value="drivers_license">Driver's License</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>ID Number *</Label>
                    <Input
                      placeholder="Enter number"
                      value={kycForm.idNumber}
                      onChange={(e) => setKycForm((p) => ({ ...p, idNumber: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Employment Status</Label>
                    <select
                      value={kycForm.employmentStatus}
                      onChange={(e) => setKycForm((p) => ({ ...p, employmentStatus: e.target.value }))}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="employed">Employed</option>
                      <option value="self_employed">Self-Employed</option>
                      <option value="student">Student</option>
                      <option value="unemployed">Unemployed</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Monthly Income <span className="text-muted-foreground">(optional)</span></Label>
                    <Input
                      placeholder="e.g. ₦300,000"
                      value={kycForm.monthlyIncome}
                      onChange={(e) => setKycForm((p) => ({ ...p, monthlyIncome: e.target.value }))}
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmitKyc}
                  disabled={submittingKyc || !kycForm.idNumber || !kycForm.fullName}
                >
                  {submittingKyc
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                    : <><ShieldCheck className="mr-2 h-4 w-4" /> Submit Verification</>
                  }
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Your information is encrypted and only shared with landlords when you book their property.
                </p>
              </div>
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
