/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, Home, Plus, Clock, X, ShieldCheck, RefreshCw } from "lucide-react";
import { Property, Booking } from "@/lib/types";
import AddPropertyModal from "@/sections/AddPropertyModal";
import EditPropertyModal from "@/components/EditPropertyModal";
import BoostButton from "@/components/BoostButton";
import { toast } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";

declare const PaystackPop: {
  setup: (config: {
    key: string;
    email: string;
    amount: number;
    currency: string;
    ref: string;
    onSuccess: (transaction: { reference: string }) => void;
    onCancel: () => void;
  }) => { openIframe: () => void };
};

// ─── Skeletons ────────────────────────────────────────────────────────────────
const Sk = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-muted ${className}`} />
);

const PropertiesSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex gap-3 rounded-xl border bg-card p-4">
        <Sk className="h-20 w-28 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2 py-1">
          <Sk className="h-4 w-3/4" />
          <Sk className="h-3 w-1/2" />
          <Sk className="h-3 w-1/3" />
        </div>
        <div className="flex gap-2 items-center">
          <Sk className="h-8 w-24 rounded-lg" />
          <Sk className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

const BookingsSkeleton = () => (
  <div className="space-y-3">
    {[1, 2].map((i) => (
      <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
        <Sk className="h-4 w-1/2" />
        <Sk className="h-3 w-2/3" />
        <Sk className="h-6 w-20 rounded-full" />
      </div>
    ))}
  </div>
);

const LandlordDashboard = () => {
  const { user } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [unlockedTenants, setUnlockedTenants] = useState<string[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [loadingUnlock, setLoadingUnlock] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const available = properties.filter((p) => p.status === "available").length;
  const rented = properties.filter((p) => p.status === "rented").length;

  // Fetch properties
  useEffect(() => {
    if (!user) return;
    const fetchProperties = async () => {
      setLoadingProperties(true);
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching properties:", error);
        toast.error("Failed to load properties");
      } else {
        const mapped: Property[] = (data ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          listingType: p.listing_type ?? "rent",
          price: p.price,
          currency: p.currency ?? "NGN",
          location: p.location,
          city: p.city,
          state: p.state,
          address: p.address,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          type: p.type,
          status: p.status,
          images: p.images ?? [],
          amenities: p.amenities ?? [],
          landlordId: p.landlord_id,
          isBoosted: p.is_boosted ?? false,
          boostExpiresAt: p.boost_expires_at ?? undefined,
          agentId: p.agent_id,
          agencyFee: p.agency_fee ?? 10,
          createdAt: p.created_at,
        }));
        setProperties(mapped);
      }
      setLoadingProperties(false);
    };
    fetchProperties();
  }, [user]);

  // Fetch bookings after properties load
  useEffect(() => {
    if (!user || properties.length === 0) return;
    const fetchBookings = async () => {
      setLoadingBookings(true);
      const propertyIds = properties.map((p) => p.id);

      const [bookingsRes, unlocksRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .in("property_id", propertyIds)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("verification_unlocks")
          .select("tenant_id")
          .eq("landlord_id", user.id),
      ]);

      if (!bookingsRes.error) {
        const mapped = (bookingsRes.data ?? []).map((b: any) => ({
          id: b.id,
          propertyId: b.property_id,
          tenantId: b.tenant_id,
          landlordId: b.landlord_id,
          agentId: b.agent_id,
          tenantName: b.tenant_name,
          tenantEmail: b.tenant_email,
          tenantPhone: b.tenant_phone,
          date: b.date,
          time: b.time,
          status: b.status,
          createdAt: b.created_at,
        }));
        setBookings(mapped);
      }

      setUnlockedTenants((unlocksRes.data ?? []).map((u: any) => u.tenant_id));
      setLoadingBookings(false);
    };
    fetchBookings();
  }, [user, properties]);

  // Toggle available ↔ rented
  const handleToggleStatus = async (p: Property) => {
    setTogglingId(p.id);
    const newStatus = p.status === "available" ? "rented" : "available";
    const { error } = await supabase
      .from("properties")
      .update({ status: newStatus })
      .eq("id", p.id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      setProperties((prev) =>
        prev.map((prop) => prop.id === p.id ? { ...prop, status: newStatus as Property["status"] } : prop)
      );
      toast.success(newStatus === "rented" ? "Marked as Rented" : "Marked as Available");
    }
    setTogglingId(null);
  };

  // Refresh listing freshness
  const handleRefreshListing = async (id: string) => {
    setRefreshingId(id);
    const { error } = await supabase
      .from("properties")
      .update({ last_verified_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) toast.success("Listing refreshed ✓");
    else toast.error("Failed to refresh listing");
    setRefreshingId(null);
  };

  // View tenant profile (with Paystack unlock)
  const handleViewTenantProfile = async (booking: Booking) => {
    if (!user) return;

    if (unlockedTenants.includes(booking.tenantId)) {
      const { data } = await supabase
        .from("tenant_verifications")
        .select("*")
        .eq("tenant_id", booking.tenantId)
        .maybeSingle();

      setSelectedTenant({
        ...data,
        tenantName: booking.tenantName,
        tenantEmail: booking.tenantEmail,
        tenantPhone: booking.tenantPhone,
      });
      return;
    }

    setLoadingUnlock(booking.id);
    const handler = PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: user.email!,
      amount: 250000,
      currency: "NGN",
      ref: `rentra_unlock_${Date.now()}`,
      onSuccess: async (transaction) => {
        await supabase.from("verification_unlocks").insert({
          landlord_id: user.id,
          tenant_id: booking.tenantId,
          property_id: booking.propertyId,
          paystack_reference: transaction.reference,
        });

        setUnlockedTenants((prev) => [...prev, booking.tenantId]);
        setLoadingUnlock(null);

        const { data } = await supabase
          .from("tenant_verifications")
          .select("*")
          .eq("tenant_id", booking.tenantId)
          .maybeSingle();

        if (!data) {
          toast.error("This tenant hasn't verified their identity yet");
          return;
        }

        setSelectedTenant({
          ...data,
          tenantName: booking.tenantName,
          tenantEmail: booking.tenantEmail,
          tenantPhone: booking.tenantPhone,
        });
      },
      onCancel: () => setLoadingUnlock(null),
    });
    handler.openIframe();
  };

  const handlePropertyAdded = (property: Property) => {
    setProperties((prev) => [property, ...prev]);
  };

  const handlePropertyUpdated = (updated: Property) => {
    setProperties((prev) => prev.map((p) => p.id === updated.id ? updated : p));
  };

  return (
    <div className="min-h-screen pt-24 pb-6">
      <div className="container">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Landlord Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name || "Landlord"}</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Property
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Building2, label: "Total Properties", value: properties.length, color: "text-primary" },
            { icon: Home, label: "Available", value: available, color: "text-green-500" },
            { icon: CheckCircle2, label: "Rented", value: rented, color: "text-muted-foreground" },
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

        {/* Properties */}
        <div className="mb-8">
          <h2 className="mb-4 font-display text-xl font-bold">Your Properties</h2>

          {loadingProperties ? (
            <PropertiesSkeleton />
          ) : properties.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-12 text-center text-muted-foreground">
              <Building2 className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="font-medium">No properties yet</p>
              <p className="text-sm mb-4">Click "Add Property" to list your first property</p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="mr-1 h-4 w-4" /> Add Property
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {properties.map((p) => (
                <div key={p.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">

                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.title} className="h-20 w-28 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Home className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.city} · {p.currency}{p.price.toLocaleString()}
                      {p.listingType === "rent" ? "/yr" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.bedrooms} bed · {p.bathrooms} bath · {p.type}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={p.status === "available" ? "default" : "secondary"} className="capitalize">
                      {p.status}
                    </Badge>

                    {/* ✅ Toggle available ↔ rented */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(p)}
                      disabled={togglingId === p.id}
                    >
                      {togglingId === p.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : p.status === "available" ? "Mark Rented" : "Mark Available"
                      }
                    </Button>

                    {/* Refresh listing */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRefreshListing(p.id)}
                      disabled={refreshingId === p.id}
                      title="Refresh listing freshness"
                    >
                      {refreshingId === p.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <RefreshCw className="h-3.5 w-3.5" />
                      }
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProperty(p)}
                    >
                      Edit
                    </Button>

                    <BoostButton
                      propertyId={p.id}
                      isBoosted={p.isBoosted}
                      onBoosted={() => {
                        setProperties((prev) =>
                          prev.map((prop) => prop.id === p.id ? { ...prop, isBoosted: true } : prop)
                        );
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div>
          <h2 className="mb-4 font-display text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5" /> Recent Inspection Requests
          </h2>

          {loadingBookings ? (
            <BookingsSkeleton />
          ) : bookings.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
              <Clock className="mx-auto mb-3 h-8 w-8 opacity-30" />
              <p className="font-medium">No inspection requests yet</p>
              <p className="text-sm">They'll appear here when tenants book your properties</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const prop = properties.find((p) => p.id === b.propertyId);
                return (
                  <div key={b.id} className="rounded-xl border bg-card p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{prop?.title ?? "Property"}</p>
                        <p className="text-sm text-muted-foreground">
                          {b.tenantName} · {b.date} at {b.time}
                        </p>
                        <p className="text-xs text-muted-foreground">{b.tenantPhone}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="capitalize">{b.status}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewTenantProfile(b)}
                          disabled={loadingUnlock === b.id}
                        >
                          {loadingUnlock === b.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : unlockedTenants.includes(b.tenantId)
                              ? "View Profile"
                              : "Verify Tenant ₦2,500"
                          }
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Edit Property Modal */}
      {editingProperty && (
        <EditPropertyModal
          property={editingProperty}
          onClose={() => setEditingProperty(null)}
          onUpdated={handlePropertyUpdated}
        />
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <AddPropertyModal
          onClose={() => setShowAddModal(false)}
          onAdded={handlePropertyAdded}
        />
      )}

      {/* Tenant Profile Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Tenant Profile</h3>
              <button onClick={() => setSelectedTenant(null)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                  {selectedTenant.tenantName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{selectedTenant.tenantName}</p>
                  <p className="text-sm text-muted-foreground">{selectedTenant.tenantEmail}</p>
                </div>
              </div>

              <div className="rounded-xl border bg-muted/50 p-4 space-y-2 text-sm">
                {selectedTenant.status === "verified" ? (
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <ShieldCheck className="h-4 w-4" /> Identity Verified
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-600 font-medium">
                    <Clock className="h-4 w-4" /> Verification Pending
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Full Name</span>
                  <span className="font-medium text-foreground">{selectedTenant.full_name}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>ID Type</span>
                  <span className="font-medium text-foreground uppercase">{selectedTenant.id_type}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Employment</span>
                  <span className="font-medium text-foreground capitalize">
                    {selectedTenant.employment_status?.replace("_", " ")}
                  </span>
                </div>
                {selectedTenant.monthly_income && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Monthly Income</span>
                    <span className="font-medium text-foreground">{selectedTenant.monthly_income}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Phone</span>
                  <span className="font-medium text-foreground">{selectedTenant.tenantPhone}</span>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={() => setSelectedTenant(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandlordDashboard;