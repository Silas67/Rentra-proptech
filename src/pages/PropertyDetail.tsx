import { useParams, Link, useNavigate } from "react-router-dom";
import { mockProperties } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, ArrowLeft, Calendar, Share2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const property = mockProperties.find((p) => p.id === id);

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Property not found</h1>
          <Button variant="ghost" asChild className="mt-4"><Link to="/search">← Back to search</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="container py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>

        {/* Image */}
        <div className="mb-6 overflow-hidden rounded-2xl">
          <img src={property.images[0]} alt={property.title} className="aspect-video w-full object-cover" />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h1 className="font-display text-2xl font-bold sm:text-3xl">{property.title}</h1>
                <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {property.address}
                </div>
              </div>
              <Badge variant={property.status === "available" ? "default" : "destructive"} className="text-sm">
                {property.status}
              </Badge>
            </div>

            <div className="mb-6 flex flex-wrap gap-6 rounded-xl border bg-card p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{property.currency}{property.price.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">per year</p>
              </div>
              <div className="flex items-center gap-1"><Bed className="h-4 w-4 text-muted-foreground" /> {property.bedrooms} Bedrooms</div>
              <div className="flex items-center gap-1"><Bath className="h-4 w-4 text-muted-foreground" /> {property.bathrooms} Bathrooms</div>
              <span className="rounded-full bg-muted px-3 py-1 text-sm capitalize">{property.type}</span>
            </div>

            <div className="mb-6">
              <h2 className="mb-2 font-display text-xl font-bold">Description</h2>
              <p className="leading-relaxed text-muted-foreground">{property.description}</p>
            </div>

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
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="sticky top-20 space-y-4 rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="font-semibold">Interested in this property?</h3>
              {property.status === "available" ? (
                <Button className="w-full" size="lg" asChild>
                  <Link to={isAuthenticated ? `/book/${property.id}` : "/login"}>
                    <Calendar className="mr-2 h-5 w-5" /> Book Inspection
                  </Link>
                </Button>
              ) : (
                <Button className="w-full" size="lg" disabled>Property Rented</Button>
              )}
              <Button variant="outline" className="w-full" onClick={() => { navigator.clipboard.writeText(window.location.href); }}>
                <Share2 className="mr-2 h-4 w-4" /> Share Listing
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
