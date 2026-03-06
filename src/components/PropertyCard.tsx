import { Link } from "react-router-dom";
import { Property } from "@/lib/types";
import { MapPin, Bed, Bath } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PropertyCardProps {
  property: Property;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const statusColor = property.status === "available" ? "bg-success text-success-foreground" : property.status === "rented" ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground";

  return (
    <Link to={`/property/${property.id}`} className="group block animate-fade-in">
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={property.images[0]}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <Badge className={`absolute left-3 top-3 ${statusColor} border-0 text-xs font-semibold`}>
            {property.status}
          </Badge>
          <div className="absolute bottom-3 left-3">
            <span className="rounded-md bg-foreground/80 px-2.5 py-1 text-sm font-bold text-background backdrop-blur-sm">
              {property.currency}{property.price.toLocaleString()}<span className="text-xs font-normal opacity-80">/yr</span>
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="mb-1 font-semibold text-card-foreground line-clamp-1">{property.title}</h3>
          <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {property.location}, {property.city}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {property.bedrooms} Bed</span>
            <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {property.bathrooms} Bath</span>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">{property.type}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
