import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/bookingService";
import { savedPropertyService } from "@/services/savedPropertyService";
import { propertyService } from "@/services/propertyService";

import { Booking, Property } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import PropertyCard from "@/components/PropertyCard";
import {
  Calendar, Search, Home, Loader2, Clock, CheckCircle2,
  XCircle, Heart, ShieldCheck,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";

type KYCStatus = "none" | "pending" | "verified" | "rejected";

// ─── Skeletons ────────────────────────────────────────────────────────────────
const Sk = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-muted ${className}`} />
);

const BookingsSkeleton = () => (
  <div className="space-y-3">
    {[1, 2].map((i) => (
      <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
        <Sk className="h-4 w-1/2" />
        <Sk className="h-3 w-1/3" />
        <div className="flex gap-2 mt-2">
          <Sk className="h-6 w-20 rounded-full" />
          <Sk className="h-6 w-16 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

const SavedSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-xl border bg-card overflow-hidden">
        <Sk className="h-40 w-full" />
        <div className="p-4 space-y-2">
          <Sk className="h-4 w-3/4" />
          <Sk className="h-3 w-1/2" />
          <Sk className="h-3 w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Status helpers ───────────────────────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────
const TenantDashboard = () => {
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingProperties, setBookingProperties] = useState<Record<string, Property>>({});
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // KYC
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
      setLoadingKyc(true);

      // ✅ All fetched in parallel including KYC
      const [bookingsData, savedPropertiesData, savedIdsData, kycRes] = await Promise.all([
        bookingService.getTenantBookings(user.id),
        savedPropertyService.getSavedProperties(user.id),
        savedPropertyService.getSavedPropertyIds(user.id),
        supabase
          .from("tenant_verifications")
          .select("status, id_type, id_number, full_name, employment_status, monthly_income")
          .eq("tenant_id", user.id)
          .maybeSingle(),
      ]);
      setBookings(bookingsData);
      setSavedProperties(savedPropertiesData);
      setSavedIds(savedIdsData);
     

      // KYC status
      if (kycRes.data) {
        setKycStatus(kycRes.data.status as KYCStatus);
        setKycForm({
          idType: kycRes.data.id_type ?? "nin",
          idNumber: kycRes.data.id_number ?? "",
          fullName: kycRes.data.full_name ?? "",
          employmentStatus: kycRes.data.employment_status ?? "employed",
          monthlyIncome: kycRes.data.monthly_income ?? "",
        });
      }

      setLoadingBookings(false);
      setLoadingSaved(false);
      setLoadingKyc(false);

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
      toast.success("Booking cancelled");
    } else {
      toast.error("Failed to cancel booking");
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
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name || "there"}</p>
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
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Heart className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">{savedProperties.length} Saved</p>
              <p className="text-sm text-muted-foreground">Properties you liked</p>
            </div>
          </div>
        </div>

        {/* Active Bookings */}
        <div className="mb-8">
          <h2 className="mb-4 font-display text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Active Inspections
          </h2>

          {loadingBookings ? (
            <BookingsSkeleton />
          ) : activeBookings.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
              <Calendar className="mx-auto mb-3 h-8 w-8 opacity-30" />
              <p className="font-medium">No upcoming inspections</p>
              <p className="text-sm mb-4">Browse listings and book an inspection to get started</p>
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
                      <img src={property.images[0]} alt={property.title} className="h-16 w-24 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Home className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{property?.title ?? "Property"}</p>
                      <p className="text-sm text-muted-foreground">{b.date} at {b.time}</p>
                      {property && (
                        <p className="text-xs text-muted-foreground">{property.city}, {property.state}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {statusIcon(b.status)}
                        <Badge variant={statusVariant(b.status)} className="capitalize">{b.status}</Badge>
                      </div>
                      {b.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(b.id)}
                          disabled={cancellingId === b.id}
                          className="text-destructive hover:text-destructive"
                        >
                          {cancellingId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Cancel"}
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
            <Heart className="h-5 w-5" /> Saved Properties
          </h2>

          {loadingSaved ? (
            <SavedSkeleton />
          ) : savedProperties.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
              <Heart className="mx-auto mb-3 h-8 w-8 opacity-30" />
              <p className="font-medium">No saved properties</p>
              <p className="text-sm">Heart a property on the listings page to save it here</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedProperties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  onSaveToggle={handleSaveToggle}
                />
              ))}
            </div>
          )}
        </div>


        {/* Identity Verification */}
        <div className="mb-8">
          <h2 className="mb-4 font-display text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Identity Verification
          </h2>

          {loadingKyc ? (
            <Sk className="h-32 w-full rounded-xl" />
          ) : kycStatus === "verified" ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <ShieldCheck className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-800">Identity Verified</h3>
              <p className="text-sm text-green-700">Landlords can see your verified status when you book their properties.</p>
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

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="fullName">Full Name (as on ID) *</Label>
                  <Input
                    id="fullName"
                    placeholder="Your legal full name"
                    value={kycForm.fullName}
                    onChange={(e) => setKycForm((p) => ({ ...p, fullName: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="idType">ID Type *</Label>
                    <select
                      id="idType"
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
                    <Label htmlFor="idNumber">ID Number *</Label>
                    <Input
                      id="idNumber"
                      placeholder="Enter number"
                      value={kycForm.idNumber}
                      onChange={(e) => setKycForm((p) => ({ ...p, idNumber: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="employmentStatus">Employment Status</Label>
                    <select
                      id="employmentStatus"
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
                    <Label htmlFor="monthlyIncome">Monthly Income <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      id="monthlyIncome"
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
            <h2 className="mb-4 font-display text-xl font-bold text-muted-foreground">Past Inspections</h2>
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