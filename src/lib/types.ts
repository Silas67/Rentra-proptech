export type UserRole = "tenant" | "agent" | "landlord";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  referralCode?: string; // agents only
  createdAt: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  city: string;
  state: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  type: "apartment" | "house" | "studio" | "duplex";
  status: "available" | "rented" | "pending";
  images: string[];
  landlordId: string;
  agentId?: string;
  amenities: string[];
  createdAt: string;
}

export interface Referral {
  id: string;
  agentId: string;
  propertyId: string;
  referralCode: string;
  clicks: number;
  inspections: number;
  commission: number;
  status: "active" | "converted" | "expired";
  createdAt: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  tenantId: string;
  agentId?: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  createdAt: string;
}
