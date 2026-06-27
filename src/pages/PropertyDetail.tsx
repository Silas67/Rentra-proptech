import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Property } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, ArrowLeft, Calendar, Share2, CheckCircle2, Loader2, Home, Flag, X, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import MessageButton from "@/components/MessageButton";
import VerificationBadge from "@/components/VerificationBadge";
import { ShieldCheck } from "lucide-react";
import ListingFreshness from "@/components/ListingFreshness";


const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const isAuthenticated = !!user;

  const MoveInCalculator = ({ price, currency }: { price: number; currency: string }) => {
    const agencyFeeRate = (property.agencyFee ?? 10) / 100;      // NIESV-approved 10%
    const legalFee = price * 0.10;        // standard 10%
    const cautionFee = price * 0.05;      // typically 1 month
    const total = price + agencyFeeRate + legalFee + cautionFee;

    return (
      <div className="rounded-xl border bg-muted/50 p-4 space-y-2 text-sm">
        <p className="font-semibold">Estimated Move-In Cost</p>
        <div className="flex justify-between"><span>Annual Rent</span><span>{currency}{price.toLocaleString()}</span></div>
        <div className="flex justify-between text-muted-foreground">
          <span>Agency Fee ({property.agencyFee ?? 10}%)</span>
          <span>{property.currency}{(property.price * agencyFeeRate).toLocaleString()}</span>
        </div>
        <div className="flex justify-between"><span>Legal Fee (10%)</span><span>{currency}{legalFee.toLocaleString()}</span></div>
        <div className="flex justify-between"><span>Caution Deposit</span><span>{currency}{cautionFee.toLocaleString()}</span></div>
        <div className="border-t pt-2 flex justify-between font-bold text-foreground">
          <span>Total</span>
          <span>{property.currency}{(property.price * (1 + agencyFeeRate + 0.10 + 0.05)).toLocaleString()}</span>
        </div>
        <p className="text-xs text-muted-foreground">Based on NIESV-approved fee caps</p>
      </div>
    );

  };

  const [displayCurrency, setDisplayCurrency] = useState("NGN");

  // Approximate exchange rates — update periodically
  const RATES: Record<string, number> = {
    NGN: 1,
    USD: 0.00065,  // 1 NGN = 0.00065 USD
    GBP: 0.00051,
    CAD: 0.00088,
  };

  const SYMBOLS: Record<string, string> = {
    NGN: "₦", USD: "$", GBP: "£", CAD: "CA$",
  };

  const convertPrice = (price: number, from: string, to: string) => {
    const inNGN = price / (RATES[from] ?? 1);
    return Math.round(inNGN * (RATES[to] ?? 1));
  };

  const displayPrice = property ? convertPrice(property.price, property.currency, displayCurrency) : 0;

  const handleReport = async () => {
    if (!user) { navigate("/login"); return; }
    if (!reportReason) {
      toast({ title: "Please select a reason", variant: "destructive" });
      return;
    }

    setReportSubmitting(true);

    const { error } = await supabase
      .from("listing_reports")
      .insert({
        property_id: property.id,
        reporter_id: user.id,
        reason: reportReason,
      });

    setReportSubmitting(false);

    if (error) {
      toast({ title: "Failed to submit report", variant: "destructive" });
      return;
    }

    toast({ title: "Report submitted. We'll review within 24 hours. ✓" });
    setReportOpen(false);
    setReportReason("");
  };

  useEffect(() => {
    if (!id) return;

    const fetchProperty = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("Error fetching property:", error);
        setNotFound(true);
      } else {
        // Map snake_case to camelCase
        const mapped: Property = {
          id: data.id,
          title: data.title,
          description: data.description,
          price: data.price,
          currency: data.currency ?? "NGN",
          listingType: data.listing_type ?? "rent",
          location: data.location,
          city: data.city,
          state: data.state,
          address: data.address,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          verificationTier: data.verification_tier ?? "self_listed",
          type: data.type,
          status: data.status,
          images: data.images ?? [],
          amenities: data.amenities ?? [],
          landlordId: data.landlord_id,
          agentId: data.agent_id,
          createdAt: data.created_at,
          agencyFee: data.agency_fee ?? 10,
        };
        setProperty(mapped);
      }

      setLoading(false);
    };

    fetchProperty();
  }, [id]);

  // ⏳ Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin opacity-40" />
          <p className="text-sm">Loading property...</p>
        </div>
      </div>
    );
  }

  // 🚫 Not found state
  if (notFound || !property) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Home className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <h1 className="text-2xl font-bold">Property not found</h1>
          <p className="mt-1 text-muted-foreground">This listing may have been removed or doesn't exist.</p>
          <Button variant="ghost" asChild className="mt-4">
            <Link to="/listings">← Back to search</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isRent = property.listingType === "rent";
  const isSold = property.status === "sold";
  const isRented = property.status === "rented";
  const isUnavailable = isSold || isRented;


  return (
    <div className="min-h-screen pb-20">
      <div className="container py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>

        {/* Image Gallery */}
        <div className="mb-6 overflow-hidden rounded-2xl shadow-lg">
          {property.images.length > 0 ? (
            <div className="space-y-2">
              {/* Main image */}
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
                <img
                  src={property.images[activeImage]}
                  alt={property.title}
                  className="h-full w-full object-cover transition-all duration-300"
                />
                {/* Listing type badge */}
                <div className="absolute left-3 top-3">
                  <span className={`rounded-full px-3 border bg-black z-50 py-1 text-xs font-semibold ${isRent
                    ? "bg-blue-500 text-white"
                    : "bg-emerald-500 text-white"
                    }`}>
                    For {isRent ? "Rent" : "Sale"}
                  </span>
                </div>
              </div>
              {/* Thumbnails */}
              {property.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {property.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`shrink-0 overflow-hidden rounded-lg border-2 transition-all ${activeImage === i ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                    >
                      <img src={img} alt="" className="h-16 w-24 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-muted">
              <Home className="h-16 w-16 opacity-20" />
            </div>
          )}
        </div>

        {property.floorPlanUrl && (
          <div className="mt-4">
            <h3 className="mb-2 font-semibold">Floor Plan</h3>
            <img
              src={property.floorPlanUrl}
              alt="Floor plan"
              className="w-full rounded-xl border object-contain max-h-64"
            />
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">

            {/* Title & Status */}
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h1 className="font-display text-2xl font-bold sm:text-3xl">{property.title}</h1>
                <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-red-500" />
                  {property.address}, {property.city}, {property.state}
                </div>
              </div>

              <Badge
                variant={property.status === "available" ? "default" : "destructive"}
                className="text-sm capitalize"
              >
                {property.status}
              </Badge>

              <ListingFreshness
                lastVerifiedAt={property.lastVerifiedAt}
                createdAt={property.createdAt}
                size="md" 
              />

              <VerificationBadge tier={property.verificationTier} size="md" />

              {property.agencyFee !== undefined && (
                property.agencyFee <= 10 ? (
                  <div className="flex items-center gap-1.5 w-fit rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs text-green-700 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    NIESV Compliant — {property.agencyFee}% agency fee
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 w-fit rounded-full bg-yellow-50 border border-yellow-200 px-3 py-1 text-xs text-yellow-700 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Agency fee is {property.agencyFee}% — above NIESV 10% cap
                  </div>
                )
              )}
            </div>



            {/* Key Details */}
            <div className="mb-6 flex flex-wrap items-center gap-6 rounded-xl border bg-card p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {property.currency}{property.price.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRent ? "per year" : "purchase price"}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Bed className="h-4 w-4 text-muted-foreground" /> {property.bedrooms} Bedrooms
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Bath className="h-4 w-4 text-muted-foreground" /> {property.bathrooms} Bathrooms
              </div>
              <span className="rounded-full bg-muted px-4 py-1 text-sm capitalize">{property.type}</span>
            </div>

            {/* Location */}
            <div className="mb-6 rounded-xl border bg-card p-4">
              <h2 className="mb-2 font-display text-lg font-bold">Location</h2>
              <p className="text-muted-foreground">{property.address}</p>
              <p className="text-muted-foreground">{property.city}, {property.state}</p>
            </div>

            {/* Description */}
            {property.description && (
              <div className="mb-6">
                <h2 className="mb-2 font-display text-xl font-bold">Description</h2>
                <p className="leading-relaxed text-muted-foreground">{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <div>
                <h2 className="mb-3 font-display text-xl font-bold">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <span key={a} className="flex items-center gap-1 rounded-full border bg-card px-3 py-1.5 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Utilities & Security */}
            {(property.hasGenerator || property.hasWater || property.hasSecurity || property.powerHours) && (
              <div className="mt-6">
                <h2 className="mb-3 font-display text-xl font-bold">Utilities & Security</h2>
                <div className="flex flex-wrap gap-3">
                  {property.hasGenerator && (
                    <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm">
                      ⚡ Generator Available
                      {property.powerHours ? ` · ${property.powerHours}hrs/day` : ""}
                    </div>
                  )}
                  {property.hasWater && (
                    <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm">
                      💧 Water Supply
                    </div>
                  )}
                  {property.hasSecurity && (
                    <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm">
                      🔒 Security
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="sticky top-20 space-y-4">
              <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                <h3 className="font-semibold">Interested in this property?</h3>

                {/* Price */}
                <div className="rounded-lg bg-muted p-3 text-center space-y-2">
                  <p className="text-xl font-bold text-primary">
                    {SYMBOLS[displayCurrency]}{displayPrice.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isRent ? "per year" : "one-time price"}
                  </p>
                  {/* Currency switcher */}
                  <div className="flex justify-center gap-1 flex-wrap">
                    {["NGN", "USD", "GBP", "CAD"].map((cur) => (
                      <button
                        key={cur}
                        onClick={() => setDisplayCurrency(cur)}
                        className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${displayCurrency === cur
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border hover:bg-muted"
                          }`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ✅ Move-In Cost Calculator — rent only */}
                {isRent && (
                  <div className="rounded-xl border bg-muted/50 p-4 space-y-2 text-sm">
                    <p className="font-semibold text-sm">Estimated Move-In Cost</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Annual Rent</span>
                        <span>{property.currency}{property.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Agency Fee (10%)</span>
                        <span>{property.currency}{(property.price * 0.10).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Legal Fee (10%)</span>
                        <span>{property.currency}{(property.price * 0.10).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Caution Deposit</span>
                        <span>{property.currency}{(property.price * 0.05).toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold text-foreground">
                        <span>Total</span>
                        <span>{property.currency}{(property.price * 1.25).toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Based on NIESV-approved fee caps</p>
                  </div>
                )}

                {/* Booking Button */}
                {isUnavailable ? (
                  <Button className="w-full" size="lg" disabled>
                    {isSold ? "Property Sold" : "Property Rented"}
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" asChild>
                    <Link to={isAuthenticated ? `/book/${property.id}` : "/login"} className="flex">
                      <Calendar className="mr-2 h-5 w-5" />
                      {isRent ? "Book Inspection" : "Schedule Viewing"}
                    </Link>
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                >
                  <Share2 className="mr-2 h-4 w-4" /> Promote Listing
                </Button>

                <MessageButton
                  propertyId={property.id}
                  landlordId={property.landlordId}
                  agentId={property.agentId}
                />
              </div>

              <div className="sticky top-60 rounded-xl border bg-card p-6 shadow-sm">
                <h3 className="font-semibold">Listed on</h3>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(property.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              {/* Report Listing */}
              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors mx-auto"
              >
                <Flag className="h-3 w-3" />
                Report this listing
              </button>

              {/* Report Modal */}
              {reportOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Report this listing</h3>
                      <button onClick={() => setReportOpen(false)}>
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Help us keep Rentra safe. Select the reason for your report.
                    </p>

                    <div className="space-y-2">
                      {[
                        "Fake or duplicate listing",
                        "Property doesn't match photos",
                        "Agent charged illegal inspection fee",
                        "Agent fee exceeds 10% NIESV cap",
                        "Suspicious or fraudulent activity",
                        "Property no longer available",
                        "Other",
                      ].map((reason) => (
                        <button
                          key={reason}
                          onClick={() => setReportReason(reason)}
                          className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${reportReason === reason
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted"
                            }`}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setReportOpen(false)}
                        disabled={reportSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleReport}
                        disabled={reportSubmitting || !reportReason}
                      >
                        {reportSubmitting
                          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                          : "Submit Report"
                        }
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;

type ToastOptions = {
  title: string;
  variant?: "default" | "destructive" | "success" | string;
};

function toast({ title, variant = "default" }: ToastOptions) {
  if (typeof document === "undefined") return;

  const containerId = "renta-toast-container";
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.style.position = "fixed";
    container.style.top = "1rem";
    container.style.right = "1rem";
    container.style.zIndex = "9999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "0.5rem";
    document.body.appendChild(container);
  }

  const toastEl = document.createElement("div");
  toastEl.textContent = title;
  toastEl.style.padding = "0.85rem 1rem";
  toastEl.style.borderRadius = "0.75rem";
  toastEl.style.border = "1px solid transparent";
  toastEl.style.boxShadow = "0 10px 30px rgba(15, 23, 42, 0.12)";
  toastEl.style.maxWidth = "320px";
  toastEl.style.fontSize = "0.95rem";
  toastEl.style.lineHeight = "1.4";
  toastEl.style.cursor = "pointer";
  toastEl.style.transition = "transform 150ms ease, opacity 150ms ease";
  toastEl.style.transform = "translateX(12px)";
  toastEl.style.opacity = "0";

  const styles = {
    default: {
      background: "#f8fafc",
      borderColor: "#cbd5e1",
      color: "#0f172a",
    },
    destructive: {
      background: "#fee2e2",
      borderColor: "#fecaca",
      color: "#991b1b",
    },
    success: {
      background: "#dcfce7",
      borderColor: "#bbf7d0",
      color: "#166534",
    },
  };

  const variantStyles = styles[variant as keyof typeof styles] ?? styles.default;

  toastEl.style.background = variantStyles.background;
  toastEl.style.borderColor = variantStyles.borderColor;
  toastEl.style.color = variantStyles.color;

  toastEl.addEventListener("click", () => {
    if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
  });

  container.appendChild(toastEl);

  requestAnimationFrame(() => {
    toastEl.style.transform = "translateX(0)";
    toastEl.style.opacity = "1";
  });

  window.setTimeout(() => {
    toastEl.style.opacity = "0";
    toastEl.style.transform = "translateX(12px)";
    window.setTimeout(() => {
      if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
      if (container && container.childElementCount === 0 && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }, 150);
  }, 3200);
}

