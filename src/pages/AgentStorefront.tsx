import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { agentPropertyService } from "@/services/agentPropertyService";
import { analyticsService } from "@/services/analyticsService";
import { Property } from "@/lib/types";
import PropertyCard from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, Store, Home, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";

const AgentStorefront = () => {
  const { agentId } = useParams<{ agentId: string }>();


  const [reviews, setReviews] = useState<unknown[]>([]);
  const [agent, setAgent] = useState<{
    id: string;
    name: string;
    phone?: string;
    bio?: string;
    video_url?: string;
    area_tags?: string[];
    storefront_slug?: string;
  } | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [listingType, setListingType] = useState("all");

  const whatsappShare = () => {
    const message = `Check out my property listings on Rentra: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };



  useEffect(() => {
    if (!agentId) return;

    const fetch = async () => {
      setLoading(true);

      const [agentProfile, agentProperties, reviewData] = await Promise.all([
        agentPropertyService.getAgentProfile(agentId),
        agentPropertyService.getAgentProperties(agentId),
        supabase
          .from("agent_reviews")
          .select("rating, comment, created_at, reviewer_id")
          .eq("agent_id", agentId)
          .order("created_at", { ascending: false })
          .limit(10)
          .then(({ data }) => data ?? []),
      ]);

      if (!agentProfile) {
        setNotFound(true);
      } else {
        setAgent(agentProfile);
        setProperties(agentProperties);
        setReviews(reviewData);

        // Log storefront visit
        analyticsService.logStorefrontView(agentId);
      }

      setLoading(false);
    };

    fetch();
  }, [agentId]);

  const filtered = properties.filter((p) => {
    const matchQuery =
      !query ||
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.city.toLowerCase().includes(query.toLowerCase()) ||
      p.location.toLowerCase().includes(query.toLowerCase());
    const matchType = type === "all" || p.type === type;
    const matchListing = listingType === "all" || p.listingType === listingType;
    return matchQuery && matchType && matchListing;
  });

  const rentCount = properties.filter((p) => p.listingType === "rent").length;
  const saleCount = properties.filter((p) => p.listingType === "sale").length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin opacity-40" />
          <p className="text-sm">Loading storefront...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Store className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <h1 className="text-2xl font-bold">Storefront not found</h1>
          <p className="mt-1 text-muted-foreground">This agent's storefront doesn't exist.</p>
          <Link to="/listings" className="mt-4 inline-block text-sm text-primary hover:underline">
            Browse all properties →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">

      {/* Agent Header Banner */}
      <div className="border-b bg-card py-10 text-center">
        <div className="container">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold">{agent?.name}'s Properties</h1>
          <p className="mt-1 text-muted-foreground">
            {properties.length} propert{properties.length !== 1 ? "ies" : "y"} available
            {rentCount > 0 && saleCount > 0 && ` · ${rentCount} for rent · ${saleCount} for sale`}
          </p>

          {/* Quick filters */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {["all", "rent", "sale"].map((lt) => (
              <button
                key={lt}
                onClick={() => setListingType(lt)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all capitalize ${listingType === lt
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
                  }`}
              >
                {lt === "all" ? "All" : lt === "rent" ? "For Rent" : "For Sale"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bio */}
      {agent?.bio && (
        <p className="mt-3 max-w-md mx-auto text-sm text-muted-foreground">{agent.bio}</p>
      )}

      {/* Area tags */}
      {agent?.area_tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {agent.area_tags.map((area: string) => (
            <span key={area} className="rounded-full border bg-muted px-3 py-1 text-xs font-medium">
              📍 {area}
            </span>
          ))}
        </div>
      )}

      {/* Video */}
      {agent?.video_url && (
        <div className="mt-4 max-w-sm mx-auto">

          <a
            href={agent.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            ▶ Watch Agent Intro
          </a>
        </div>
      )
      }

      <div className="container py-8">

        {/* Search & Filters */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, city or location..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Property Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="studio">Studio</SelectItem>
              <SelectItem value="duplex">Duplex</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Properties Grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <AgentPropertyCard key={p.id} property={p} agentId={agentId!} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            <Home className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p className="font-medium">No properties found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}

        <button
          onClick={whatsappShare}
          className="mt-3 flex items-center gap-2 mx-auto rounded-full border border-green-500 bg-green-50 px-4 py-1.5 text-sm text-green-600 font-medium hover:bg-green-100 transition-colors"
        >
          <Phone className="h-4 w-4" />
          Share on WhatsApp
        </button>s

      </div>


    </div >
  );
};

// Wrapper that appends ?ref=agentId to property links
const AgentPropertyCard = ({ property, agentId }: { property: Property; agentId: string }) => {
  return (
    <div className="relative">
      <PropertyCard property={property} />
      <Link
        to={`/property/${property.id}?ref=${agentId}`}
        className="absolute inset-0 z-10"
        aria-label={property.title}
      />
    </div>
  );
};

export default AgentStorefront;