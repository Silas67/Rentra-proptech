import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Property } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, ArrowLeft, Calendar, Share2, CheckCircle2, Loader2, Home, Flag, X, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import MessageButton from "@/components/MessageButton";
import { ShieldCheck } from "lucide-react";
import { toast } from "@/components/ui/sonner";

// ─── Skeleton ────────────────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-muted ${className}`} />
);

const PropertyDetailSkeleton = () => (
  <div className="min-h-screen pb-20">
    <div className="container py-6">
      <Skeleton className="h-8 w-20 mb-4" />
      {/* Image */}
      <Skeleton className="w-full aspect-video rounded-2xl mb-6" />
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        {/* Sidebar */}
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
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
  const [displayCurrency, setDisplayCurrency] = useState("NGN");
  const [copied, setCopied] = useState(false);

  const isAuthenticated = !!user;

  const RATES: Record<string, number> = {
    NGN: 1,
    USD: 0.00065,
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

  const displayPrice = property
    ? convertPrice(property.price, property.currency, displayCurrency)
    : 0;

  const handleReport = async () => {
    if (!user) { navigate("/login"); return; }
    if (!reportReason) {
      toast.error("Please select a reason");
      return;
    }

    setReportSubmitting(true);
    const { error } = await supabase
      .from("listing_reports")
      .insert({
        property_id: property!.id,
        reporter_id: user.id,
        reason: reportReason,
      });
    setReportSubmitting(false);

    if (error) {
      toast.error("Failed to submit report");
      return;
    }

    toast.success("Report submitted. We'll review within 24 hours.");
    setReportOpen(false);
    setReportReason("");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
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
        setNotFound(true);
      } else {
        // Fetch agent phone separately
        let agentPhone: string | undefined = undefined;
        if (data.agent_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("phone")
            .eq("id", data.agent_id)
            .maybeSingle();
          agentPhone = profile?.phone ?? undefined;
        }

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
          type: data.type,
          status: data.status,
          images: data.images ?? [],
          amenities: data.amenities ?? [],
          hasGenerator: data.has_generator ?? false,
          hasWater: data.has_water ?? false,
          hasSecurity: data.has_security ?? false,
          powerHours: data.power_hours ?? 0,
          lastVerifiedAt: data.last_verified_at ?? data.created_at,
          landlordId: data.landlord_id,
          agentId: data.agent_id,
          agentPhone,
          createdAt: data.created_at,
          agencyFee: data.agency_fee ?? 10,
          floorPlanUrl: data.floor_plan_url ?? undefined,
        };
        setProperty(mapped);
      }
      setLoading(false);
    };

    fetchProperty();
  }, [id]);

  // ⏳ Skeleton loading
  if (loading) return <PropertyDetailSkeleton />;

  // 🚫 Not found
  if (notFound || !property) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Home className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <h1 className="text-2xl font-bold">Property not found</h1>
          <p className="mt-1 text-muted-foreground">This listing may have been removed.</p>
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
  const agencyFeeRate = (property.agencyFee ?? 10) / 100;

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
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
                <img
                  src={property.images[activeImage]}
                  alt={property.title}
                  className="h-full w-full object-cover transition-all duration-300"
                />
                <div className="absolute left-3 top-3">
                  <span className={`rounded-full px-3 border py-1 text-xs font-semibold ${isRent ? "bg-blue-500 text-white" : "bg-emerald-500 text-white"}`}>
                    For {isRent ? "Rent" : "Sale"}
                  </span>
                </div>
                {isUnavailable && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                    <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-foreground">
                      {isSold ? "Sold" : "Rented"}
                    </span>
                  </div>
                )}
              </div>
              {property.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {property.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${activeImage === i ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
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

        {/* Main layout */}
        <div className="grid gap-8 lg:grid-cols-3">

          {/* Left — Property Info */}
          <div className="lg:col-span-2 space-y-6">

            {/* Title & badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="secondary" className="capitalize">{property.type}</Badge>
                <Badge variant={property.status === "available" ? "default" : "secondary"} className="capitalize">
                  {property.status}
                </Badge>
                {property.hasGenerator && <Badge variant="outline">⚡ Generator</Badge>}
                {property.hasWater && <Badge variant="outline">💧 Water</Badge>}
                {property.hasSecurity && <Badge variant="outline">🔒 Security</Badge>}
              </div>
              <h1 className="font-display text-2xl font-bold md:text-3xl">{property.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                {property.address ?? property.location}, {property.city}, {property.state}
              </p>

              {/* NIESV ribbon */}
              {property.agencyFee !== undefined && (
                property.agencyFee <= 10 ? (
                  <div className="mt-2 flex items-center gap-1.5 w-fit rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs text-green-700 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    NIESV Compliant — {property.agencyFee}% agency fee
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-1.5 w-fit rounded-full bg-yellow-50 border border-yellow-200 px-3 py-1 text-xs text-yellow-700 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Agency fee is {property.agencyFee}% — above NIESV 10% cap
                  </div>
                )
              )}

              {/* Listing freshness */}
              <p className="mt-2 text-xs text-muted-foreground">
                Listed {new Date(property.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">{property.bedrooms}</p>
                  <p className="text-xs text-muted-foreground">Bedrooms</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">{property.bathrooms}</p>
                  <p className="text-xs text-muted-foreground">Bathrooms</p>
                </div>
              </div>
              {property.powerHours > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <div>
                    <p className="text-sm font-semibold">{property.powerHours}hrs</p>
                    <p className="text-xs text-muted-foreground">Power/day</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {property.description && (
              <div>
                <h2 className="mb-2 font-display text-xl font-bold">About this property</h2>
                <p className="text-muted-foreground leading-relaxed">{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div>
                <h2 className="mb-3 font-display text-xl font-bold">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <span key={a} className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Floor plan */}
            {property.floorPlanUrl && (
              <div>
                <h2 className="mb-2 font-display text-xl font-bold">Floor Plan</h2>
                <img src={property.floorPlanUrl} alt="Floor plan" className="w-full rounded-xl border object-contain max-h-64" />
              </div>
            )}
          </div>

          {/* Right — Sidebar */}
          <div className="space-y-4">
            <div className="sticky top-20 space-y-4">
              <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                <h3 className="font-semibold">Interested in this property?</h3>

                {/* Price with currency switcher */}
                <div className="rounded-lg bg-muted p-3 text-center space-y-2">
                  <p className="text-xl font-bold text-primary">
                    {SYMBOLS[displayCurrency]}{displayPrice.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isRent ? "per year" : "one-time price"}
                  </p>
                  <div className="flex justify-center gap-1 flex-wrap">
                    {["NGN", "USD", "GBP", "CAD"].map((cur) => (
                      <button
                        key={cur}
                        onClick={() => setDisplayCurrency(cur)}
                        className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                          displayCurrency === cur
                            ? "bg-primary text-primary-foreground"
                            : "bg-background border hover:bg-muted"
                        }`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Move-in calculator — rent only */}
                {isRent && (
                  <div className="rounded-xl border bg-muted/50 p-4 space-y-2 text-sm">
                    <p className="font-semibold text-sm">Estimated Move-In Cost</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Annual Rent</span>
                        <span>{SYMBOLS[displayCurrency]}{displayPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Agency Fee ({property.agencyFee ?? 10}%)</span>
                        <span>{SYMBOLS[displayCurrency]}{Math.round(displayPrice * agencyFeeRate).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Legal Fee (10%)</span>
                        <span>{SYMBOLS[displayCurrency]}{Math.round(displayPrice * 0.10).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Caution Deposit</span>
                        <span>{SYMBOLS[displayCurrency]}{Math.round(displayPrice * 0.05).toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold text-foreground">
                        <span>Total</span>
                        <span>{SYMBOLS[displayCurrency]}{Math.round(displayPrice * (1 + agencyFeeRate + 0.10 + 0.05)).toLocaleString()}</span>
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
                    <Link to={isAuthenticated ? `/book/${property.id}` : "/login"} className="flex items-center justify-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      {isRent ? "Book Inspection" : "Schedule Viewing"}
                    </Link>
                  </Button>
                )}

                {/* Share */}
                <Button variant="outline" className="w-full" onClick={handleCopyLink}>
                  <Share2 className="mr-2 h-4 w-4" />
                  {copied ? "Link Copied!" : "Share Listing"}
                </Button>

                <MessageButton
                  propertyId={property.id}
                  landlordId={property.landlordId}
                  agentId={property.agentId}
                />
              </div>

              {/* Listed on */}
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <h3 className="font-semibold text-sm mb-1">Listed on</h3>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(property.createdAt).toLocaleDateString(undefined, {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
              </div>

              {/* Report */}
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
                    <p className="text-sm text-muted-foreground">Help us keep Rentra safe. Select the reason for your report.</p>
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
                          className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                            reportReason === reason ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
                          }`}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setReportOpen(false)} disabled={reportSubmitting}>
                        Cancel
                      </Button>
                      <Button className="flex-1" onClick={handleReport} disabled={reportSubmitting || !reportReason}>
                        {reportSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Report"}
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