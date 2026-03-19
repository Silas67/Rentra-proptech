import { useState } from "react";
import { mockProperties, mockBookings } from "@/lib/mock-data";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, Clock, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Property } from "@/lib/types";

const LandlordDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>(mockProperties);

  const myProperties = properties.filter((p) => p.landlordId === "u3");
  const available = myProperties.filter((p) => p.status === "available").length;
  const rented = myProperties.filter((p) => p.status === "rented").length;
  const bookings = mockBookings;

  const markRented = (id: string) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "rented" as const } : p))
    );
    toast({ title: "Property marked as rented" });
  };

  return (
    <div className="min-h-screen pt-24 pb-6">
      <div className="container">
        <div className="mb-6 w-full text-center ">
          <h1 className="font-sans text-3xl font-bold">Landlord Dashboard</h1>
          <p className="text-muted-foreground">Manage your properties, {user?.name || "Landlord"}</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Building2, label: "Total Properties", value: myProperties.length, color: "text-primary" },
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
          <div className="space-y-3">
            {myProperties.map((p) => (
              <div key={p.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
                <img src={p.images[0]} alt={p.title} className="h-20 w-28 rounded-lg object-cover shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-muted-foreground">{p.location} · {p.currency}{p.price.toLocaleString()}/yr</p>
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
        </div>

        {/* Recent Bookings */}
        <div>
          <h2 className="mb-4 font-display text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5" /> Recent Inspection Requests
          </h2>
          {bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.map((b) => {
                const prop = properties.find((p) => p.id === b.propertyId);
                return (
                  <div key={b.id} className="rounded-xl border bg-card p-4">
                    <p className="font-medium">{prop?.title}</p>
                    <p className="text-sm text-muted-foreground">{b.tenantName} · {b.date} at {b.time} · {b.tenantPhone}</p>
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
    </div>
  );
};

export default LandlordDashboard;
