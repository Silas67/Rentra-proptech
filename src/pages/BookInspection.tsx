import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar, Loader2, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { propertyService } from "@/services/propertyService";
import { bookingService } from "@/services/bookingService";
import { Property } from "@/lib/types";

const BookInspection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [property, setProperty] = useState<Property | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    date: "",
    time: "",
  });

  // 🔍 Fetch property details
  useEffect(() => {
    if (!id) return;

    const fetch = async () => {
      setLoadingProperty(true);
      const data = await propertyService.getPropertyById(id);
      setProperty(data);
      setLoadingProperty(false);
    };

    fetch();
  }, [id]);

  // Pre-fill form when user loads
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    if (!property) return;

    if (!form.date || !form.time || !form.name || !form.email || !form.phone) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const booking = await bookingService.createBooking({
      propertyId: property.id,
      tenantId: user.id,
      landlordId: property.landlordId,
      agentId: property.agentId,
      date: form.date,
      time: form.time,
      tenantName: form.name,
      tenantPhone: form.phone,
      tenantEmail: form.email,
    });

    setSubmitting(false);

    if (!booking) {
      toast({
        title: "Something went wrong",
        description: "Couldn't complete booking. Try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Inspection booked! 🎉",
      description: `You're set for ${form.date} at ${form.time}.`,
    });

    navigate(`/property/${id}`);
  };

  // ⏳ Loading property
  if (loadingProperty) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin opacity-40" />
          <p className="text-sm">Loading property...</p>
        </div>
      </div>
    );
  }

  // 🚫 Property not found
  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Home className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <h1 className="text-2xl font-bold">Property not found</h1>
          <Button variant="ghost" asChild className="mt-4">
            <span onClick={() => navigate("/listings")}>← Back to listings</span>
          </Button>
        </div>
      </div>
    );
  }

  const isRent = property.listingType === "rent";

  return (
    <div className="min-h-screen py-6">
      <div className="container max-w-lg">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>

        <div className="rounded-xl border bg-card p-6 shadow-sm">

          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary shrink-0" />
            <div>
              <h1 className="font-display text-xl font-bold">
                {isRent ? "Book an Inspection" : "Schedule a Viewing"}
              </h1>
              <p className="text-sm text-muted-foreground line-clamp-1">{property.title}</p>
              <p className="text-xs text-muted-foreground">{property.city}, {property.state}</p>
            </div>
          </div>

          {/* Property Summary */}
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-muted p-3">
            {property.images?.[0] ? (
              <img
                src={property.images[0]}
                alt={property.title}
                className="h-14 w-20 rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-md bg-background">
                <Home className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-medium text-sm">{property.title}</p>
              <p className="text-xs text-muted-foreground">
                {property.currency}{property.price.toLocaleString()} {isRent ? "/yr" : "for sale"}
              </p>
              <p className="text-xs text-muted-foreground">
                {property.bedrooms} bed · {property.bathrooms} bath · {property.type}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+234 000 000 0000"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date">Preferred Date</Label>
                <Input
                  id="date"
                  type="date"
                  min={today}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">Preferred Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  required
                />
              </div>
            </div>

            <Button className="w-full" size="lg" type="submit" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking...</>
              ) : (
                <><Calendar className="mr-2 h-4 w-4" /> Confirm Booking</>
              )}
            </Button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default BookInspection;
