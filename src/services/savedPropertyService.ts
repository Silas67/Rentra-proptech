import { supabase } from "@/lib/supabase";
import { Property } from "@/lib/types";

// 🔄 Helper: map Supabase snake_case to camelCase Property type
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

export const savedPropertyService = {

  // ❤️ Save a property
  async saveProperty(tenantId: string, propertyId: string): Promise<boolean> {
    const { error } = await supabase
      .from("saved_properties")
      .insert({ tenant_id: tenantId, property_id: propertyId });

    if (error) {
      console.error("saveProperty error:", error);
      return false;
    }

    return true;
  },

  // 💔 Remove a saved property
  async removeSavedProperty(tenantId: string, propertyId: string): Promise<boolean> {
    const { error } = await supabase
      .from("saved_properties")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("property_id", propertyId);

    if (error) {
      console.error("removeSavedProperty error:", error);
      return false;
    }

    return true;
  },

  // 📋 Get all saved properties for a tenant (with full property details)
  async getSavedProperties(tenantId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from("saved_properties")
      .select("property_id, properties(*)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getSavedProperties error:", error);
      return [];
    }

    return (data ?? [])
      .map((row: any) => row.properties)
      .filter(Boolean)
      .map(mapProperty);
  },

  // 🔍 Check if a specific property is saved by a tenant
  async isPropertySaved(tenantId: string, propertyId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("saved_properties")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("property_id", propertyId)
      .maybeSingle();

    if (error) {
      console.error("isPropertySaved error:", error);
      return false;
    }

    return !!data;
  },

  // 📋 Get just the saved property IDs for a tenant (lightweight, for heart button state)
  async getSavedPropertyIds(tenantId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("saved_properties")
      .select("property_id")
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("getSavedPropertyIds error:", error);
      return [];
    }

    return (data ?? []).map((row: any) => row.property_id);
  },
};
