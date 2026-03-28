import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import PropertyCard from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { Property } from "@/lib/types";
import { savedPropertyService } from "@/services/savedPropertyService";
import { propertyService } from "@/services/propertyService";

const PropertySearch = () => {
  const { user, role } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [savedIds, setSavedIds] = useState<string[]>([]);



  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);

      const [properties, savedIds] = await Promise.all([
        propertyService.getProperties(),

        user && role === "tenant"
          ? savedPropertyService.getSavedPropertyIds(user.id)
          : Promise.resolve([]),
      ]);

      if (!properties.length && !savedIds.length) {
        setError("Failed to load properties. Please try again.");
      } else {
        setProperties(properties);
        setSavedIds(savedIds);
      }

      setLoading(false);
    };

    fetchProperties();
  }, []);

  // 🔎 Filter locally after fetch
  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const matchQuery =
        !query ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.location.toLowerCase().includes(query.toLowerCase()) ||
        p.city.toLowerCase().includes(query.toLowerCase());
      const matchType = type === "all" || p.type === type;
      const matchPrice =
        priceRange === "all" ||
        (priceRange === "low" && p.price <= 2000000) ||
        (priceRange === "mid" && p.price > 2000000 && p.price <= 5000000) ||
        (priceRange === "high" && p.price > 5000000);
      return matchQuery && matchType && matchPrice;
    });
  }, [properties, query, type, priceRange]);

  return (
    <div className="min-h-screen pt-24 pb-6">
      <div className="container">
        <div className="mb-8 w-full text-center">
          <h1 className="font-display text-3xl font-bold text-forest-dark">Browse Properties</h1>
          <p className="text-muted-foreground">Find your next home now</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-3 rounded-xl bg-transparent p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by location or title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="studio">Studio</SelectItem>
              <SelectItem value="duplex">Duplex</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Price" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="low">Under ₦2M</SelectItem>
              <SelectItem value="mid">₦2M – ₦5M</SelectItem>
              <SelectItem value="high">Above ₦5M</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* States */}
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin opacity-40" />
            <p className="text-sm">Loading properties...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-destructive">
            <p className="text-lg font-medium">{error}</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <PropertyCard key={p.id} property={p} isSaved={savedIds.includes(p.id)} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            <Search className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p className="text-lg font-medium">No properties found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertySearch;