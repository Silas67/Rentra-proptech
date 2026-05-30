/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import PropertyCard from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { Property } from "@/lib/types";
import { savedPropertyService } from "@/services/savedPropertyService";
import { propertyService } from "@/services/propertyService";
import { Button } from "@/components/ui/button";
import { savedSearchService } from "@/services/savedSearchService";
import { Bell, BellOff, Bookmark } from "lucide-react";
import { toast } from "@/components/ui/sonner";

// 🦴 Single skeleton card
const PropertyCardSkeleton = () => (
  <div className="overflow-hidden rounded-xl border bg-card shadow-sm animate-pulse">
    {/* Image placeholder */}
    <div className="aspect-[4/3] bg-muted" />
    <div className="p-4 space-y-3">
      {/* Title */}
      <div className="h-4 w-3/4 rounded bg-muted" />
      {/* Location */}
      <div className="h-3 w-1/2 rounded bg-muted" />
      {/* Details row */}
      <div className="flex gap-3">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-3 w-16 rounded bg-muted ml-auto" />
      </div>
    </div>
  </div>
);

// 🦴 Grid of skeleton cards
const PropertySearchSkeleton = () => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <PropertyCardSkeleton key={i} />
    ))}
  </div>
);

const PropertySearch = () => {
  const { user, role } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savingSearch, setSavingSearch] = useState(false);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [listingType, setListingType] = useState("all");

  const handleSaveSearch = async () => {
    if (!user) { navigate("/login"); return; }
    setSavingSearch(true);

    const label = [
      query || "All properties",
      type !== "all" ? type : null,
      listingType !== "all" ? listingType : null,
      priceRange !== "all" ? priceRange : null,
    ].filter(Boolean).join(" · ");

    const saved = await savedSearchService.saveSearch(user.id, label, {
      query, type, listingType, priceRange,
    });
    if (saved) {
      setSavedSearches((prev) => [saved, ...prev]);
      toast({ title: "Search saved! We'll alert you when new matches appear ✓" });
    }

    setSavingSearch(false);
  };

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      const [fetchedProperties, fetchedSavedIds] = await Promise.all([
        propertyService.getProperties(),
        user && role === "tenant"
          ? savedPropertyService.getSavedPropertyIds(user.id)
          : Promise.resolve([]),
      ]);

      setProperties(fetchedProperties);
      setSavedIds(fetchedSavedIds);
    } catch (err) {
      console.error("Failed to fetch properties:", err);
      setError("Failed to load properties. Please try again.");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProperties();
  }, [user, role]);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const matchQuery =
        !query ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.location.toLowerCase().includes(query.toLowerCase()) ||
        p.city.toLowerCase().includes(query.toLowerCase());
      const matchType = type === "all" || p.type === type;
      const matchListing = listingType === "all" || p.listingType === listingType;
      const matchPrice =
        priceRange === "all" ||
        (priceRange === "low" && p.price <= 2000000) ||
        (priceRange === "mid" && p.price > 2000000 && p.price <= 5000000) ||
        (priceRange === "high" && p.price > 5000000);
      return matchQuery && matchType && matchListing && matchPrice;
    });
  }, [properties, query, type, priceRange, listingType]);

  return (
    <div className="min-h-screen pt-24 pb-6">
      <div className="container">

        {/* Header */}
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
          <Select value={listingType} onValueChange={setListingType}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Listing" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">For Rent & Sale</SelectItem>
              <SelectItem value="rent">For Rent</SelectItem>
              <SelectItem value="sale">For Sale</SelectItem>
            </SelectContent>
          </Select>
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
          {role === "tenant" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveSearch}
              disabled={savingSearch}
              className="shrink-0"
            >
              {savingSearch
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><Bookmark className="mr-1.5 h-4 w-4" /> Save Search</>
              }
            </Button>
          )}
        </div>

        {/* States */}
        {loading ? (
          <PropertySearchSkeleton />
        ) : error ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-lg font-medium text-destructive mb-2">{error}</p>
            <Button variant="outline" onClick={fetchProperties} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {filtered.length} propert{filtered.length !== 1 ? "ies" : "y"} found
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  isSaved={savedIds.includes(p.id)}
                />
              ))}
            </div>
          </>
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