import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, Clock, Home, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Property, Booking } from "@/lib/types";
import AddPropertyModal from "@/sections/AddPropertyModal";

const LandlordDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const available = properties.filter((p) => p.status === "available").length;
  const rented = properties.filter((p) => p.status === "rented").length;

  // Fetch landlord's properties
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
        toast({ title: "Failed to load properties", variant: "destructive" });
      } else {
        // Map snake_case to camelCase
        const mapped: Property[] = (data ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          listingType: p.listing_type,
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
          agentId: p.agent_id,
          createdAt: p.created_at,
        }));
        setProperties(mapped);
      }

      setLoadingProperties(false);
    };

    fetchProperties();
  }, [toast, user]);

  // Fetch bookings for landlord's properties
  useEffect(() => {
    if (!user || properties.length === 0) return;

    const fetchBookings = async () => {
      setLoadingBookings(true);

      const propertyIds = properties.map((p) => p.id);

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .in("property_id", propertyIds)  // ✅ join through property_id
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching bookings:", error);
      } else {
        setBookings(data ?? []);
      }

      setLoadingBookings(false);
    };

    fetchBookings();
  }, [user, properties]);

  const markRented = async (id: string) => {
    const { error } = await supabase
      .from("properties")
      .update({ status: "rented" })
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to update property", variant: "destructive" });
      return;
    }

    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "rented" as const } : p))
    );
    toast({ title: "Property marked as rented" });
  };

  const handlePropertyAdded = (property: Property) => {
    setProperties((prev) => [property, ...prev]);
  };

  return (
    <div className="min-h-screen pt-24 pb-6">
      <div className="container">

        {/* Header */}
        <div className="mb-6 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h1 className="font-sans text-3xl font-bold">Landlord Dashboard</h1>
            <p className="text-muted-foreground">Manage your properties, {user?.name || "Landlord"}</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Building2, label: "Total Properties", value: properties.length, color: "text-primary" },
            { icon: Home, label: "Available", value: available, color: "text-success" },
            { icon: CheckCircle2, label: "Rented", value: rented, color: "text-secondary" },
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
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading properties...
            </div>
          ) : properties.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-12 text-center text-muted-foreground">
              <Building2 className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="font-medium">No properties yet</p>
              <p className="text-sm">Click "Add Property" to list your first property</p>
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
                  <div className="flex-1">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.location}, {p.city} · {p.currency} {p.price.toLocaleString()}/yr
                    </p>
                    <p className="text-xs text-muted-foreground">{p.bedrooms} bed · {p.bathrooms} bath · {p.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.status === "available" ? "default" : "secondary"}>{p.status}</Badge>
                    {p.status === "available" && (
                      <Button variant="outline" size="sm" onClick={() => markRented(p.id)}>
                        Mark Rented
                      </Button>
                    )}
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
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading bookings...
            </div>
          ) : bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.map((b) => {
                const prop = properties.find((p) => p.id === b.propertyId);
                return (
                  <div key={b.id} className="rounded-xl border bg-card p-4">
                    <p className="font-medium">{prop?.title ?? "Property"}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.tenantName} · {b.date} at {b.time} · {b.tenantPhone}
                    </p>
                    <Badge variant="secondary" className="mt-2">{b.status}</Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">No inspection requests yet</p>
          )}
        </div>
      </div>

      {/* Add Property Modal */}
      {showAddModal && (
        <AddPropertyModal
          onClose={() => setShowAddModal(false)}
          onAdded={handlePropertyAdded}
        />
      )}
    </div>
  );
};

export default LandlordDashboard;