import { Link } from "react-router-dom";
import { Property } from "@/lib/types";
import { MapPin, Bed, Bath, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { savedPropertyService } from "@/services/savedPropertyService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import VerificationBadge from "./VerificationBadge";

interface PropertyCardProps {
  property: Property;
  isSaved?: boolean;
  onSaveToggle?: (propertyId: string, saved: boolean) => void;
}

const PropertyCard = ({ property, isSaved = false, onSaveToggle }: PropertyCardProps) => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [saved, setSaved] = useState(isSaved);
  const [savingId, setSavingId] = useState(false);

  const statusColor =
    property.status === "available"
      ? "bg-success text-success-foreground"
      : property.status === "rented"
        ? "bg-destructive text-destructive-foreground"
        : "bg-warning text-warning-foreground";

  const isRent = property.listingType === "rent";

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigating to property detail
    e.stopPropagation();

    if (!user) {
      toast({ title: "Please log in to save properties", variant: "destructive" });
      return;
    }

    if (role !== "tenant") {
      toast({ title: "Only tenants can save properties", variant: "destructive" });
      return;
    }

    setSavingId(true);

    if (saved) {
      const success = await savedPropertyService.removeSavedProperty(user.id, property.id);
      if (success) {
        setSaved(false);
        onSaveToggle?.(property.id, false);
        toast({ title: "Removed from saved properties" });
      }
    } else {
      const success = await savedPropertyService.saveProperty(user.id, property.id);
      if (success) {
        setSaved(true);
        onSaveToggle?.(property.id, true);
        toast({ title: "Property saved! ❤️" });
      }
    }

    setSavingId(false);
  };

  return (
    <Link to={`/property/${property.id}`} className="group block animate-fade-in">
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden">
          {property.images?.[0] ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}

          {/* Status badge */}
          <Badge className={`absolute left-3 top-3 ${statusColor} border-0 text-xs font-semibold`}>
            {property.status}
          </Badge>

          {/* Listing type badge */}
          <Badge className={`absolute left-3 bottom-10 border-0 text-xs font-semibold ${isRent ? "bg-blue-500 text-white" : "bg-emerald-500 text-white"
            }`}>
            {isRent ? "For Rent" : "For Sale"}
          </Badge>

          {/* Heart button — only show for tenants or unauthenticated */}
          {role !== "landlord" && role !== "agent" && (
            <button
              onClick={handleSaveToggle}
              disabled={savingId}
              className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-all ${saved
                ? "bg-red-500 text-white shadow-md"
                : "bg-white/80 text-gray-500 hover:bg-white hover:text-red-500 backdrop-blur-sm"
                }`}
            >
              <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
            </button>
          )}

          {/* Price badge */}
          <div className="absolute bottom-3 left-3">
            <span className="rounded-md bg-foreground/80 px-2.5 py-1 text-sm font-bold text-background backdrop-blur-sm">
              {property.currency}{property.price.toLocaleString()}
              <span className="text-xs font-normal opacity-80">
                {isRent ? "/yr" : " for sale"}
              </span>
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="mb-1 font-semibold text-card-foreground font-sans line-clamp-1">
            {property.title}
          </h3>
          <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-red-500" />
            {property.location}, {property.city}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" /> {property.bedrooms} Bed
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" /> {property.bathrooms} Bath
            </span>
            <span className="ml-auto">
              <VerificationBadge tier={property.verificationTier} />
            </span>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">
              {property.type}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
