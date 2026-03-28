import { supabase } from "@/lib/supabase";
import { Property } from "@/lib/types";

// 🔄 Helper: map Supabase snake_case to our camelCase Property type
const mapProperty = (p: Record<string, any>): Property => ({
  id: p.id,
  title: p.title,
  description: p.description,
  price: p.price,
  currency: p.currency ?? "NGN",
  listingType: p.listing_type ?? "rent",
  location: p.location,
  city: p.city,
  state: p.state,
  address: p.address,
  bedrooms: p.bedrooms,
  bathrooms: p.bathrooms,
  type: p.type,
  status: p.status,
  images: p.images ?? [],
  amenities: p.amenities ?? [],
  landlordId: p.landlord_id,
  agentId: p.agent_id,
  createdAt: p.created_at,
});

export type PropertyFilters = {
  query?: string;
  type?: string;
  status?: string;
  listingType?: "rent" | "sale" | "all";
  priceMin?: number;
  priceMax?: number;
  city?: string;
  state?: string;
};

export const propertyService = {

  // 📋 Get all available properties with optional filters
  async getProperties(filters: PropertyFilters = {}): Promise<Property[]> {
    let query = supabase.from("properties").select("*");

    // Status filter — default to available only
    if (filters.status) {
      query = query.eq("status", filters.status);
    } else {
      query = query.eq("status", "available");
    }

    // Listing type filter
    if (filters.listingType && filters.listingType !== "all") {
      query = query.eq("listing_type", filters.listingType);
    }

    // Property type filter
    if (filters.type && filters.type !== "all") {
      query = query.eq("type", filters.type);
    }

    // City filter
    if (filters.city) {
      query = query.ilike("city", `%${filters.city}%`);
    }

    // State filter
    if (filters.state) {
      query = query.ilike("state", `%${filters.state}%`);
    }

    // Price range filter
    if (filters.priceMin !== undefined) {
      query = query.gte("price", filters.priceMin);
    }
    if (filters.priceMax !== undefined) {
      query = query.lte("price", filters.priceMax);
    }

    // Text search across title and location
    if (filters.query) {
      query = query.or(
        `title.ilike.%${filters.query}%,location.ilike.%${filters.query}%,city.ilike.%${filters.query}%`
      );
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("getProperties error:", error);
      return [];
    }

    return (data ?? []).map(mapProperty);
  },

  // 🔍 Get a single property by ID
  async getPropertyById(id: string): Promise<Property | null> {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("getPropertyById error:", error);
      return null;
    }

    return mapProperty(data);
  },

  // 🏠 Get all properties belonging to a landlord
  async getLandlordProperties(landlordId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("landlord_id", landlordId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getLandlordProperties error:", error);
      return [];
    }

    return (data ?? []).map(mapProperty);
  },

  // ➕ Create a new property
  async createProperty(
    payload: Omit<Property, "id" | "createdAt">,
    landlordId: string
  ): Promise<Property | null> {
    const { data, error } = await supabase
      .from("properties")
      .insert({
        title: payload.title,
        description: payload.description,
        price: payload.price,
        currency: payload.currency,
        listing_type: payload.listingType,
        location: payload.location,
        city: payload.city,
        state: payload.state,
        address: payload.address,
        bedrooms: payload.bedrooms,
        bathrooms: payload.bathrooms,
        type: payload.type,
        status: payload.status,
        images: payload.images,
        amenities: payload.amenities,
        landlord_id: landlordId,
        agent_id: payload.agentId ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("createProperty error:", error);
      return null;
    }

    return mapProperty(data);
  },

  // ✏️ Update a property
  async updateProperty(
    id: string,
    updates: Partial<Omit<Property, "id" | "createdAt" | "landlordId">>
  ): Promise<Property | null> {
    const { data, error } = await supabase
      .from("properties")
      .update({
        ...(updates.title && { title: updates.title }),
        ...(updates.description && { description: updates.description }),
        ...(updates.price !== undefined && { price: updates.price }),
        ...(updates.currency && { currency: updates.currency }),
        ...(updates.listingType && { listing_type: updates.listingType }),
        ...(updates.location && { location: updates.location }),
        ...(updates.city && { city: updates.city }),
        ...(updates.state && { state: updates.state }),
        ...(updates.address && { address: updates.address }),
        ...(updates.bedrooms !== undefined && { bedrooms: updates.bedrooms }),
        ...(updates.bathrooms !== undefined && { bathrooms: updates.bathrooms }),
        ...(updates.type && { type: updates.type }),
        ...(updates.status && { status: updates.status }),
        ...(updates.images && { images: updates.images }),
        ...(updates.amenities && { amenities: updates.amenities }),
        ...(updates.agentId !== undefined && { agent_id: updates.agentId }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("updateProperty error:", error);
      return null;
    }

    return mapProperty(data);
  },

  // 🔄 Shorthand to update just the status
  async updateStatus(
    id: string,
    status: Property["status"]
  ): Promise<boolean> {
    const { error } = await supabase
      .from("properties")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("updateStatus error:", error);
      return false;
    }

    return true;
  },

  // 🗑️ Delete a property
  async deleteProperty(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("deleteProperty error:", error);
      return false;
    }

    return true;
  },
};
