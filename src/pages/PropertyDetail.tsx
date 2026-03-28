import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Property } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, ArrowLeft, Calendar, Share2, CheckCircle2, Loader2, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const isAuthenticated = !!user;

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
          type: data.type,
          status: data.status,
          images: data.images ?? [],
          amenities: data.amenities ?? [],
          landlordId: data.landlord_id,
          agentId: data.agent_id,
          createdAt: data.created_at,
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
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="sticky top-20 space-y-4 rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="font-semibold">Interested in this property?</h3>

              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xl font-bold text-primary">
                  {property.currency}{property.price.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRent ? "per year" : "one-time price"}
                </p>
              </div>

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
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                }}
              >
                <Share2 className="mr-2 h-4 w-4" /> Promote Listing
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
