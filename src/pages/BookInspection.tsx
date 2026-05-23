import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar, Loader2, Home, ShieldCheck, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { propertyService } from "@/services/propertyService";
import { bookingService } from "@/services/bookingService";
import { inspectionPassService } from "@/services/inspectionPassService";
import { crmService } from "@/services/crmService";
import { Property } from "@/lib/types";
import { supabase } from "@/lib/supabase";

// Paystack inline type
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

const INSPECTION_PASS_AMOUNT = 15000; // ₦15,000

const BookInspection = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const agentRef = searchParams.get("ref");

  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "pass" | "confirmed">("form");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [wantsPass, setWantsPass] = useState(true);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    date: "",
    time: "",
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    date?: string;
    time?: string;
  }>({});

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

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!form.name.trim()) newErrors.name = "Full name is required";
    if (!form.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Enter a valid email";
    if (!form.phone) newErrors.phone = "Phone number is required";
    if (!form.date) newErrors.date = "Please select a date";
    if (!form.time) newErrors.time = "Please select a time";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const today = new Date().toISOString().split("T")[0];

  const handleSubmitReview = async () => {
    if (!user || !bookingId || rating === 0) return;
    setSubmittingReview(true);

    await supabase.from("agent_reviews").insert({
      agent_id: agentRef ?? property?.agentId,
      reviewer_id: user.id,
      booking_id: bookingId,
      rating,
      comment,
    });

    setSubmittingReview(false);
    setShowReview(false);
    toast({ title: "Review submitted! Thank you ✓" });
  };

  // Step 1 — Submit the booking form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (!property) return;
    if (!validate()) return;

    setSubmitting(true);

    const booking = await bookingService.createBooking({
      propertyId: property.id,
      tenantId: user.id,
      landlordId: property.landlordId,
      agentId: agentRef ?? property.agentId,
      date: form.date,
      time: form.time,
      tenantName: form.name,
      tenantPhone: form.phone,
      tenantEmail: form.email,
    });

    setSubmitting(false);

    if (!booking) {
      toast({ title: "Failed to create booking", variant: "destructive" });
      return;
    }

    setBookingId(booking.id);

    // Auto-create CRM lead if booking came through agent storefront
    if (agentRef) {
      crmService.createLeadFromBooking({
        agentId: agentRef,
        propertyId: property.id,
        tenantName: form.name,
        tenantPhone: form.phone,
        tenantEmail: form.email,
      });
    }

    setStep("pass");
  };

  // Step 2a — Pay for inspection pass via Paystack
  const handlePayPass = () => {
    if (!user || !bookingId || !property) return;

    const handler = PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: form.email,
      amount: INSPECTION_PASS_AMOUNT * 100, // Paystack uses kobo
      currency: "NGN",
      ref: `rentra_pass_${Date.now()}`,
      onSuccess: async (transaction) => {
        // Save the pass record to Supabase
        const pass = await inspectionPassService.createPass({
          bookingId,
          tenantId: user.id,
          agentId: agentRef ?? property.agentId ?? property.landlordId,
          propertyId: property.id,
          amount: INSPECTION_PASS_AMOUNT,
          paystackReference: transaction.reference,
        });

        if (!pass) {
          toast({ title: "Payment received but pass record failed. Contact support.", variant: "destructive" });
          return;
        }

        toast({ title: "Inspection pass secured! ✓" });
        setStep("confirmed");
        if (property.agentPhone) {
          const message = `New inspection booking on Rentra!\n\nProperty: ${property.title}\nTenant: ${form.name}\nPhone: ${form.phone}\nDate: ${form.date} at ${form.time}\n\nLog in to Rentra to confirm.`;
          window.open(`https://wa.me/${property.agentPhone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank");
        }
      },
      onCancel: () => {
        toast({ title: "Payment cancelled", variant: "destructive" });
      },
    });

    handler.openIframe();
  };

  // Step 2b — Skip the pass and just confirm booking
  const handleSkipPass = () => {
    toast({ title: "Inspection booked! 🎉", description: `You're set for ${form.date} at ${form.time}.` });
    setStep("confirmed");

    if (property.agentPhone) {
      const message = `New inspection booking on Rentra!\n\nProperty: ${property.title}\nTenant: ${form.name}\nPhone: ${form.phone}\nDate: ${form.date} at ${form.time}\n\nLog in to Rentra to confirm.`;
      window.open(`https://wa.me/${property.agentPhone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank");
    }
  };



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

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Home className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <h1 className="text-2xl font-bold">Property not found</h1>
          <Button variant="ghost" onClick={() => navigate("/listings")} className="mt-4">← Back to listings</Button>
        </div>
      </div>
    );
  }

  const isRent = property.listingType === "rent";

  // ✅ Confirmed state
  if (step === "confirmed") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <ShieldCheck className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="font-display text-2xl font-bold">Booking Confirmed!</h1>
          <p className="text-muted-foreground text-sm">
            Your inspection for <span className="font-medium text-foreground">{property.title}</span> is
            scheduled for <span className="font-medium text-foreground">{form.date}</span> at <span className="font-medium text-foreground">{form.time}</span>.
          </p>
          {wantsPass && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Your ₦{INSPECTION_PASS_AMOUNT.toLocaleString()} inspection pass is secured in escrow
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate("/tenant-dashboard")}>View My Bookings</Button>
            <Button variant="outline" onClick={() => navigate("/listings")}>Back to Listings</Button>
          </div>
        </div>
      </div>
    );
  }

  // 🛡️ Inspection Pass step
  if (step === "pass") {
    return (
      <div className="min-h-screen py-6">
        <div className="container max-w-lg">
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-display text-xl font-bold">Secure Your Inspection</h2>
              <p className="text-sm text-muted-foreground">
                Your booking is confirmed. Add a Verified Inspection Pass to protect yourself from fake listings and no-show agents.
              </p>
            </div>

            {/* What you get */}
            <div className="rounded-xl border bg-muted/50 p-4 space-y-3 text-sm">
              <p className="font-semibold">What you get with a Verified Pass:</p>
              <div className="space-y-2">
                {[
                  "₦15,000 held securely in escrow — not paid to agent until inspection confirmed",
                  "Full refund if property doesn't match listing or agent no-shows",
                  "Priority support if anything goes wrong",
                  "Verified Inspection badge on your booking",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-primary">₦{INSPECTION_PASS_AMOUNT.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Held in escrow until inspection is confirmed</p>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={() => { setWantsPass(true); handlePayPass(); }}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Pay ₦{INSPECTION_PASS_AMOUNT.toLocaleString()} — Secure My Pass
              </Button>
              <button
                onClick={() => { setWantsPass(false); handleSkipPass(); }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Skip for now — continue without pass
              </button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Payments are processed securely via Paystack. Rentra never stores your card details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 📋 Booking Form (default step)
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

          {/* Agent attribution notice */}
          {agentRef && (
            <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              🏠 You're booking through an agent's storefront
            </div>
          )}

          {/* Property summary */}
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-muted p-3">
            {property.images?.[0] ? (
              <img src={property.images[0]} alt={property.title} className="h-14 w-20 rounded-md object-cover shrink-0" />
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
          <form onSubmit={handleSubmitForm} className="space-y-4" noValidate>

            <div className="space-y-1">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
                placeholder="Your full name"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }}
                placeholder="your@email.com"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => { setForm({ ...form, phone: e.target.value }); if (errors.phone) setErrors((p) => ({ ...p, phone: undefined })); }}
                placeholder="+234 000 000 0000"
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="date">Preferred Date</Label>
                <Input
                  id="date"
                  type="date"
                  min={today}
                  value={form.date}
                  onChange={(e) => { setForm({ ...form, date: e.target.value }); if (errors.date) setErrors((p) => ({ ...p, date: undefined })); }}
                  className={errors.date ? "border-destructive" : ""}
                />
                {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="time">Preferred Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={form.time}
                  onChange={(e) => { setForm({ ...form, time: e.target.value }); if (errors.time) setErrors((p) => ({ ...p, time: undefined })); }}
                  className={errors.time ? "border-destructive" : ""}
                />
                {errors.time && <p className="text-xs text-destructive">{errors.time}</p>}
              </div>
            </div>

            <Button className="w-full" size="lg" type="submit" disabled={submitting}>
              {submitting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking...</>
                : <><Calendar className="mr-2 h-4 w-4" /> Continue</>
              }
            </Button>

          </form>

          {/* Review section — only if came through agent storefront */}
          {agentRef && !showReview && (
            <button
              onClick={() => setShowReview(true)}
              className="text-sm text-primary hover:underline"
            >
              Leave a review for your agent
            </button>
          )}

          {showReview && (
            <div className="rounded-xl border bg-card p-4 space-y-3 text-left">
              <p className="font-semibold text-sm">Rate your agent</p>

              {/* Star rating */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-colors ${star <= rating ? "text-yellow-400" : "text-muted-foreground"
                      }`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this agent..."
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowReview(false)}>
                  Skip
                </Button>
                <Button size="sm" className="flex-1" onClick={handleSubmitReview} disabled={submittingReview || rating === 0}>
                  {submittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Review"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookInspection;