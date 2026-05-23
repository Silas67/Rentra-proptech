/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/lib/supabase";
import { Property } from "@/lib/types";

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

export const agentPropertyService = {

  // ➕ Add a property to agent's promoted list
  async addProperty(agentId: string, propertyId: string): Promise<boolean> {
    const { error } = await supabase
      .from("agent_properties")
      .insert({ agent_id: agentId, property_id: propertyId });

    if (error) {
      console.error("addProperty error:", error);
      return false;
    }

    return true;
  },

  // ➖ Remove a property from agent's promoted list
  async removeProperty(agentId: string, propertyId: string): Promise<boolean> {
    const { error } = await supabase
      .from("agent_properties")
      .delete()
      .eq("agent_id", agentId)
      .eq("property_id", propertyId);

    if (error) {
      console.error("removeProperty error:", error);
      return false;
    }

    return true;
  },

  // 📋 Get all properties an agent is promoting (with full property details)
  async getAgentProperties(agentId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from("agent_properties")
      .select("property_id, properties(*)")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getAgentProperties error:", error);
      return [];
    }

    return (data ?? [])
      .map((row: any) => row.properties)
      .filter(Boolean)
      .map(mapProperty);
  },

  // 🔍 Get just the promoted property IDs (lightweight check)
  async getPromotedPropertyIds(agentId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("agent_properties")
      .select("property_id")
      .eq("agent_id", agentId);

    if (error) {
      console.error("getPromotedPropertyIds error:", error);
      return [];
    }

    return (data ?? []).map((row: any) => row.property_id);
  },

  // 🔍 Check if a property is already in agent's list
  async isPropertyPromoted(agentId: string, propertyId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("agent_properties")
      .select("id")
      .eq("agent_id", agentId)
      .eq("property_id", propertyId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  },

  // 👤 Get agent profile info for public storefront
  async getAgentProfile(agentId: string): Promise<{
    id: string;
    name: string;
    phone?: string;
    bio?: string;
    video_url?: string;
    area_tags?: string[];
    storefront_slug?: string;
  } | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, phone, bio, video_url, area_tags, storefront_slug")
      .eq("id", agentId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  },
};
