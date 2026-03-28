import { supabase } from "@/lib/supabase";
import { Booking } from "@/lib/types";

// 🔄 Helper: map Supabase snake_case to camelCase Booking type
const mapBooking = (b: Record<string, any>): Booking => ({
  id: b.id,
  propertyId: b.property_id,
  tenantId: b.tenant_id,
  agentId: b.agent_id,
  date: b.date,
  time: b.time,
  status: b.status,
  tenantName: b.tenant_name,
  tenantPhone: b.tenant_phone,
  tenantEmail: b.tenant_email,
  createdAt: b.created_at,
});

export type CreateBookingPayload = {
  propertyId: string;
  tenantId: string;
  landlordId: string;
  agentId?: string;
  date: string;
  time: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
};

export const bookingService = {

  // ➕ Create a new booking
  async createBooking(payload: CreateBookingPayload): Promise<Booking | null> {
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        property_id: payload.propertyId,
        tenant_id: payload.tenantId,
        landlord_id: payload.landlordId,
        agent_id: payload.agentId ?? null,
        date: payload.date,
        time: payload.time,
        status: "pending",
        tenant_name: payload.tenantName,
        tenant_phone: payload.tenantPhone,
        tenant_email: payload.tenantEmail,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("createBooking error:", error);
      return null;
    }

    return mapBooking(data);
  },

  // 📋 Get all bookings for a tenant
  async getTenantBookings(tenantId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getTenantBookings error:", error);
      return [];
    }

    return (data ?? []).map(mapBooking);
  },

  // 📋 Get all bookings for a landlord's properties
  async getLandlordBookings(landlordId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("landlord_id", landlordId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getLandlordBookings error:", error);
      return [];
    }

    return (data ?? []).map(mapBooking);
  },

  // 📋 Get all bookings assigned to an agent
  async getAgentBookings(agentId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getAgentBookings error:", error);
      return [];
    }

    return (data ?? []).map(mapBooking);
  },

  // 🔄 Update booking status
  async updateBookingStatus(
    id: string,
    status: Booking["status"]
  ): Promise<boolean> {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("updateBookingStatus error:", error);
      return false;
    }

    return true;
  },

  // 🗑️ Cancel a booking
  async cancelBooking(id: string): Promise<boolean> {
    return bookingService.updateBookingStatus(id, "cancelled");
  },
};
