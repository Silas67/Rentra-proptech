/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/services/bookingService";
import { propertyService } from "@/services/propertyService";
import { agentPropertyService } from "@/services/agentPropertyService";
import { analyticsService, StorefrontStats } from "@/services/analyticsService";
import { supabase } from "@/lib/supabase";
import { Booking, Property } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye, TrendingUp, Loader2, CheckCircle2, Clock,
  Plus, Minus, Link2, Copy, Store, Search,
  ShieldCheck, Shield, AlertCircle, BarChart2,
  MousePointer, Calendar, ArrowUpRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import AgentCRM from "@/components/AgentCRM";

const statusVariant = (status: Booking["status"]) => {
  switch (status) {
    case "confirmed": return "default" as const;
    case "cancelled": return "destructive" as const;
    case "completed": return "secondary" as const;
    default: return "secondary" as const;
  }
};

type Tab = "storefront" | "browse" | "bookings" | "analytics" | "crm" | "mypage" | "verification";
type VerificationStatus = "none" | "pending" | "verified" | "rejected";

const AgentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("storefront");
  const [promotedProperties, setPromotedProperties] = useState<Property[]>([]);
  const [promotedIds, setPromotedIds] = useState<string[]>([]);
  const [loadingPromoted, setLoadingPromoted] = useState(true);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [browseQuery, setBrowseQuery] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingProperties, setBookingProperties] = useState<Record<string, Property>>({});
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [stats, setStats] = useState<StorefrontStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("none");
  const [loadingVerification, setLoadingVerification] = useState(true);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [verificationForm, setVerificationForm] = useState({ cacNumber: "", niesvNumber: "", idType: "nin", idNumber: "" });
  const [pageForm, setPageForm] = useState({ bio: "", videoUrl: "", areaTags: [] as string[] });
  const [savingPage, setSavingPage] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);

  // Fetch promoted properties
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoadingPromoted(true);
      const [promoted, ids] = await Promise.all([
        agentPropertyService.getAgentProperties(user.id),
        agentPropertyService.getPromotedPropertyIds(user.id),
      ]);
      setPromotedProperties(promoted);
      setPromotedIds(ids);
      setLoadingPromoted(false);
    };
    fetch();
  }, [user]);

  // Fetch bookings
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoadingBookings(true);
      const data = await bookingService.getAgentBookings(user.id);
      setBookings(data);
      setLoadingBookings(false);
      const uniqueIds = [...new Set(data.map((b) => b.propertyId))];
      const map: Record<string, Property> = {};
      await Promise.all(uniqueIds.map(async (pid) => {
        const p = await propertyService.getPropertyById(pid);
        if (p) map[pid] = p;
      }));
      setBookingProperties(map);
    };
    fetch();
  }, [user]);

  // Fetch all properties when browse tab opens
  useEffect(() => {
    if (activeTab !== "browse" || allProperties.length > 0) return;
    const fetch = async () => {
      setLoadingAll(true);
      const data = await propertyService.getProperties();
      setAllProperties(data);
      setLoadingAll(false);
    };
    fetch();
  }, [activeTab]);

  // Fetch analytics when tab opens
  useEffect(() => {
    if (activeTab !== "analytics" || !user || stats) return;
    const fetch = async () => {
      setLoadingStats(true);
      const data = await analyticsService.getStorefrontStats(user.id);
      setStats(data);
      setLoadingStats(false);
    };
    fetch();
  }, [activeTab, user]);

  // Fetch verification status
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoadingVerification(true);
      const { data } = await supabase
        .from("agent_verifications")
        .select("status, cac_number, niesv_number, id_type, id_number")
        .eq("agent_id", user.id)
        .maybeSingle();
      if (data) {
        setVerificationStatus(data.status as VerificationStatus);
        setVerificationForm({
          cacNumber: data.cac_number ?? "",
          niesvNumber: data.niesv_number ?? "",
          idType: data.id_type ?? "nin",
          idNumber: data.id_number ?? "",
        });
      }
      setLoadingVerification(false);
    };
    fetch();
  }, [user]);

  // Fetch mypage data when tab opens
  useEffect(() => {
    if (activeTab !== "mypage" || !user) return;
    const fetch = async () => {
      setLoadingPage(true);
      const { data } = await supabase
        .from("profiles")
        .select("bio, video_url, area_tags")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setPageForm({
          bio: data.bio ?? "",
          videoUrl: data.video_url ?? "",
          areaTags: data.area_tags ?? [],
        });
      }
      setLoadingPage(false);
    };
    fetch();
  }, [activeTab, user]);

  const handleToggleProperty = async (property: Property) => {
    if (!user) return;
    setTogglingId(property.id);
    const isPromoted = promotedIds.includes(property.id);
    if (isPromoted) {
      const success = await agentPropertyService.removeProperty(user.id, property.id);
      if (success) {
        setPromotedIds((prev) => prev.filter((id) => id !== property.id));
        setPromotedProperties((prev) => prev.filter((p) => p.id !== property.id));
        toast({ title: "Removed from your storefront" });
      }
    } else {
      const success = await agentPropertyService.addProperty(user.id, property.id);
      if (success) {
        setPromotedIds((prev) => [...prev, property.id]);
        setPromotedProperties((prev) => [...prev, property]);
        toast({ title: "Added to your storefront! 🏠" });
      }
    }
    setTogglingId(null);
  };

  const handleUpdateStatus = async (bookingId: string, status: Booking["status"]) => {
    setUpdatingId(bookingId);
    const success = await bookingService.updateBookingStatus(bookingId, status);
    if (success) {
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status } : b));
      toast({ title: `Inspection ${status}` });
    } else {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
    setUpdatingId(null);
  };

  const handleSubmitVerification = async () => {
    if (!user || !verificationForm.idNumber) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setSubmittingVerification(true);
    const { error } = await supabase.from("agent_verifications").upsert({
      agent_id: user.id,
      cac_number: verificationForm.cacNumber || null,
      niesv_number: verificationForm.niesvNumber || null,
      id_type: verificationForm.idType,
      id_number: verificationForm.idNumber,
      status: "pending",
    });
    setSubmittingVerification(false);
    if (error) { toast({ title: "Failed to submit verification", variant: "destructive" }); return; }
    setVerificationStatus("pending");
    toast({ title: "Verification submitted! We'll review within 48 hours. ✓" });
  };

  const handleSavePage = async () => {
    if (!user) return;
    setSavingPage(true);
    await supabase.from("profiles").update({
      bio: pageForm.bio || null,
      video_url: pageForm.videoUrl || null,
      area_tags: pageForm.areaTags,
    }).eq("id", user.id);
    setSavingPage(false);
    toast({ title: "Storefront updated! ✓" });
  };

  const copyStorefrontLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/agent/${user?.id}`);
    toast({ title: "Storefront link copied! 🔗" });
  };

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const filteredProperties = allProperties.filter((p) =>
    !browseQuery ||
    p.title.toLowerCase().includes(browseQuery.toLowerCase()) ||
    p.city.toLowerCase().includes(browseQuery.toLowerCase()) ||
    p.location.toLowerCase().includes(browseQuery.toLowerCase())
  );

  const VerificationBadge = () => {
    if (verificationStatus === "verified") return <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium"><ShieldCheck className="h-4 w-4" /> Verified Agent</span>;
    if (verificationStatus === "pending") return <span className="flex items-center gap-1.5 text-sm text-yellow-600 font-medium"><Clock className="h-4 w-4" /> Verification Pending</span>;
    if (verificationStatus === "rejected") return <span className="flex items-center gap-1.5 text-sm text-destructive font-medium"><AlertCircle className="h-4 w-4" /> Verification Rejected</span>;
    return <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Shield className="h-4 w-4" /> Not Verified</span>;
  };

  const PropertyRow = ({ property, isPromoted }: { property: Property; isPromoted?: boolean }) => (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
      {property.images?.[0]
        ? <img src={property.images[0]} alt={property.title} className="h-20 w-28 rounded-lg object-cover shrink-0" />
        : <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-muted"><Store className="h-6 w-6 text-muted-foreground" /></div>
      }
      <div className="flex-1">
        <p className="font-medium">{property.title}</p>
        <p className="text-sm text-muted-foreground">
          {property.city}, {property.state} · {property.currency}{property.price.toLocaleString()}
          {property.listingType === "rent" ? "/yr" : " for sale"}
        </p>
        <div className="mt-1 flex gap-2">
          <Badge variant="secondary" className="text-xs capitalize">{property.type}</Badge>
          <Badge variant={property.status === "available" ? "default" : "secondary"} className="text-xs capitalize">{property.status}</Badge>
        </div>
      </div>
      <Button
        variant={isPromoted ? "outline" : "default"}
        size="sm"
        onClick={() => handleToggleProperty(property)}
        disabled={togglingId === property.id}
        className={isPromoted ? "text-destructive hover:text-destructive" : ""}
      >
        {togglingId === property.id
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : isPromoted
            ? <><Minus className="mr-1 h-3.5 w-3.5" /> Remove</>
            : <><Plus className="mr-1 h-3.5 w-3.5" /> Add to Storefront</>
        }
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-6">
      <div className="container">

        {/* Header */}
        <div className="mb-6 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h1 className="font-display text-3xl font-bold">Agent Dashboard</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-muted-foreground">Welcome back, {user?.name || "Agent"}</p>
              <VerificationBadge />
            </div>
          </div>
          <Button onClick={copyStorefrontLink} className="flex items-center justify-center gap-2">
            <Copy className="h-4 w-4" /> Copy My Storefront Link
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          {[
            { icon: Store, label: "Promoted", value: promotedProperties.length, color: "text-primary" },
            { icon: Clock, label: "Pending", value: pendingBookings.length, color: "text-yellow-500" },
            { icon: Eye, label: "Confirmed", value: confirmedBookings.length, color: "text-blue-500" },
            { icon: CheckCircle2, label: "Completed", value: completedBookings.length, color: "text-green-500" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border bg-muted p-1 overflow-x-auto">
          {([
            { key: "storefront", label: "My Storefront", icon: Store },
            { key: "browse", label: "Browse & Add", icon: Plus },
            { key: "bookings", label: "Inspections", icon: TrendingUp },
            { key: "analytics", label: "Analytics", icon: BarChart2 },
            { key: "crm", label: "CRM", icon: TrendingUp },
            { key: "mypage", label: "My Page", icon: Store },
            { key: "verification", label: "Verification", icon: ShieldCheck },
          ] as { key: Tab; label: string; icon: any }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.key === "verification" && verificationStatus === "none" && (
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
              )}
            </button>
          ))}
        </div>

        {/* ── My Storefront ── */}
        {activeTab === "storefront" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Store className="h-5 w-5" /> Your Promoted Properties
              </h2>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("browse")}>
                <Plus className="mr-1 h-4 w-4" /> Add Properties
              </Button>
            </div>
            {loadingPromoted ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
              </div>
            ) : promotedProperties.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-card p-12 text-center text-muted-foreground">
                <Store className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p className="font-medium">Your storefront is empty</p>
                <p className="text-sm mb-4">Browse available properties and add them to your storefront</p>
                <Button size="sm" onClick={() => setActiveTab("browse")}>
                  <Plus className="mr-1 h-4 w-4" /> Browse Properties
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Your storefront:</span>
                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {window.location.origin}/agent/{user?.id}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" onClick={copyStorefrontLink}>
                    <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                  </Button>
                </div>
                {promotedProperties.map((p) => <PropertyRow key={p.id} property={p} isPromoted={true} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Browse & Add ── */}
        {activeTab === "browse" && (
          <div>
            <div className="mb-4">
              <h2 className="mb-3 font-display text-xl font-bold">Browse All Properties</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title, city or location..."
                  value={browseQuery}
                  onChange={(e) => setBrowseQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            {loadingAll ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading properties...
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProperties.map((p) => <PropertyRow key={p.id} property={p} isPromoted={promotedIds.includes(p.id)} />)}
                {filteredProperties.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <Search className="mx-auto mb-3 h-10 w-10 opacity-30" />
                    <p>No properties found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Inspections ── */}
        {activeTab === "bookings" && (
          <div>
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
              <TrendingUp className="h-5 w-5" /> Inspection Requests
            </h2>
            {loadingBookings ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
              </div>
            ) : bookings.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-card p-12 text-center text-muted-foreground">
                <TrendingUp className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p className="font-medium">No inspection requests yet</p>
                <p className="text-sm">Share your storefront link to start getting bookings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => {
                  const property = bookingProperties[b.propertyId];
                  return (
                    <div key={b.id} className="rounded-xl border bg-card p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">{property?.title ?? "Property"}</p>
                          <p className="text-sm text-muted-foreground">{b.tenantName} · {b.tenantPhone}</p>
                          <p className="text-sm text-muted-foreground">📅 {b.date} at {b.time}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusVariant(b.status)} className="capitalize">{b.status}</Badge>
                          {b.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => handleUpdateStatus(b.id, "confirmed")} disabled={updatingId === b.id}>
                                {updatingId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(b.id, "cancelled")} disabled={updatingId === b.id}>
                                Decline
                              </Button>
                            </>
                          )}
                          {b.status === "confirmed" && (
                            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(b.id, "completed")} disabled={updatingId === b.id}>
                              {updatingId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark Complete"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Analytics ── */}
        {activeTab === "analytics" && (
          <div>
            <h2 className="mb-2 font-display text-xl font-bold flex items-center gap-2">
              <BarChart2 className="h-5 w-5" /> Storefront Analytics
            </h2>
            <p className="text-sm text-muted-foreground mb-6">Last 30 days</p>
            {loadingStats ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading analytics...
              </div>
            ) : !stats ? (
              <div className="rounded-xl border border-dashed bg-card p-12 text-center text-muted-foreground">
                <BarChart2 className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p className="font-medium">No data yet</p>
                <p className="text-sm">Share your storefront link to start tracking visits</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stat cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { icon: MousePointer, label: "Storefront Visits", value: stats.totalViews, color: "text-primary", bg: "bg-primary/10" },
                    { icon: Eye, label: "Properties Viewed", value: stats.uniqueProperties, color: "text-blue-500", bg: "bg-blue-50" },
                    { icon: Calendar, label: "Inspections Booked", value: stats.totalBookings, color: "text-green-500", bg: "bg-green-50" },
                    { icon: ArrowUpRight, label: "Conversion Rate", value: `${stats.conversionRate}%`, color: "text-yellow-500", bg: "bg-yellow-50" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border bg-card p-5 shadow-sm">
                      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Chart */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold">Daily Visits — Last 14 Days</h3>
                  {stats.totalViews === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      No visits yet. Share your storefront link to start tracking!
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stats.viewsByDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={1} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} labelStyle={{ color: "hsl(var(--foreground))" }} cursor={{ fill: "hsl(var(--muted))" }} />
                        <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Attribution Breakdown */}
                <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
                  <h3 className="font-semibold">Booking Attribution</h3>
                  <p className="text-xs text-muted-foreground">Properties where bookings were attributed to you in the last 30 days</p>
                  {bookings.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground text-sm">
                      <TrendingUp className="mx-auto mb-2 h-8 w-8 opacity-30" />
                      No attributed bookings yet. Share your storefront link to start tracking.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bookings.map((b) => {
                        const property = bookingProperties[b.propertyId];
                        const isIntroducer = b.agentId === user?.id;
                        return (
                          <div key={b.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                            <div>
                              <p className="text-sm font-medium">{property?.title ?? "Property"}</p>
                              <p className="text-xs text-muted-foreground">{b.tenantName} · {b.date}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs font-medium rounded-full px-2 py-1 ${isIntroducer
                                ? "bg-blue-50 text-blue-600 border border-blue-200"
                                : "bg-green-50 text-green-600 border border-green-200"
                                }`}>
                                {isIntroducer ? "You introduced" : "You closed"}
                              </span>
                              <p className="text-xs text-muted-foreground mt-1 capitalize">{b.status}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Storefront link */}
                <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm text-muted-foreground truncate">{window.location.origin}/agent/{user?.id}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={copyStorefrontLink}>
                    <Copy className="mr-1 h-3.5 w-3.5" /> Copy Link
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CRM ── */}
        {activeTab === "crm" && user && (
          <AgentCRM agentId={user.id} />
        )}

        {/* ── My Page ── */}
        {activeTab === "mypage" && (
          <div className="max-w-lg space-y-5">
            <div>
              <h2 className="font-display text-xl font-bold">Customize My Storefront</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This is what tenants see when they visit your storefront link
              </p>
            </div>
            {loadingPage ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
              </div>
            ) : (
              <div className="space-y-4">
                {/* Bio */}
                <div className="space-y-1">
                  <Label>About You</Label>
                  <textarea
                    value={pageForm.bio}
                    onChange={(e) => setPageForm((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="e.g. I'm a licensed real estate agent based in Abuja with 5 years experience in Jabi, Wuse, and Maitama..."
                    rows={4}
                    maxLength={300}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground text-right">{pageForm.bio.length}/300</p>
                </div>

                {/* Video URL */}
                <div className="space-y-1">
                  <Label>Intro Video URL <span className="text-muted-foreground">(optional)</span></Label>
                  <Input
                    placeholder="Paste a YouTube or Loom link"
                    value={pageForm.videoUrl}
                    onChange={(e) => setPageForm((p) => ({ ...p, videoUrl: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">This plays on your storefront page so tenants can meet you</p>
                </div>

                {/* Area Tags */}
                <div className="space-y-2">
                  <Label>Areas You Cover</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Jabi", "Wuse", "Wuse 2", "Maitama", "Asokoro", "Garki", "Gwarinpa", "Lugbe", "Kubwa", "Kado", "Utako", "Lokogoma", "Katampe", "Life Camp", "Apo"].map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => setPageForm((p) => ({
                          ...p,
                          areaTags: p.areaTags.includes(area)
                            ? p.areaTags.filter((a) => a !== area)
                            : [...p.areaTags, area],
                        }))}
                        className={`rounded-full border px-3 py-1 text-sm transition-colors ${pageForm.areaTags.includes(area)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted"
                          }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Select the areas in Abuja you specialise in</p>
                </div>

                {/* Preview link */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Your storefront link</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                      {window.location.origin}/agent/{user?.id}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={copyStorefrontLink}>
                    <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                  </Button>
                </div>

                <Button className="w-full" onClick={handleSavePage} disabled={savingPage}>
                  {savingPage
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    : "Save Storefront"
                  }
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Verification ── */}
        {activeTab === "verification" && (
          <div className="max-w-lg">
            <h2 className="mb-2 font-display text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Agent Verification
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Verified agents get a trust badge on their storefront and higher visibility.
            </p>
            {loadingVerification ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
              </div>
            ) : verificationStatus === "verified" ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-800">You're a Verified Agent!</h3>
                <p className="text-sm text-green-700">Your storefront now shows a Verified Agent badge.</p>
              </div>
            ) : verificationStatus === "pending" ? (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-center space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-yellow-800">Verification Under Review</h3>
                <p className="text-sm text-yellow-700">We're reviewing your credentials. This takes up to 48 hours.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {verificationStatus === "rejected" && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Verification Rejected</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Please update your details and resubmit.</p>
                    </div>
                  </div>
                )}
                <div className="rounded-xl border bg-muted/50 p-4 space-y-2 text-sm">
                  <p className="font-semibold">Benefits of getting verified:</p>
                  {["Verified Agent badge on your storefront", "Higher trust with tenants and landlords", "Access to premium Rentra features", "NIESV compliance confirmation"].map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />{benefit}
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="idType">ID Type *</Label>
                    <select
                      id="idType"
                      value={verificationForm.idType}
                      onChange={(e) => setVerificationForm((prev) => ({ ...prev, idType: e.target.value }))}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="nin">NIN — National Identity Number</option>
                      <option value="bvn">BVN — Bank Verification Number</option>
                      <option value="passport">International Passport</option>
                      <option value="drivers_license">Driver's License</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="idNumber">ID Number *</Label>
                    <Input
                      id="idNumber"
                      value={verificationForm.idNumber}
                      onChange={(e) => setVerificationForm((prev) => ({ ...prev, idNumber: e.target.value }))}
                      placeholder="Enter your ID number"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="niesvNumber">NIESV Registration Number <span className="text-muted-foreground">(optional)</span></Label>
                    <Input
                      id="niesvNumber"
                      value={verificationForm.niesvNumber}
                      onChange={(e) => setVerificationForm((prev) => ({ ...prev, niesvNumber: e.target.value }))}
                      placeholder="e.g. NIESV/2024/00123"
                    />
                    <p className="text-xs text-muted-foreground">Providing this speeds up verification</p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cacNumber">CAC Business Registration Number <span className="text-muted-foreground">(optional)</span></Label>
                    <Input
                      id="cacNumber"
                      value={verificationForm.cacNumber}
                      onChange={(e) => setVerificationForm((prev) => ({ ...prev, cacNumber: e.target.value }))}
                      placeholder="e.g. RC1234567"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSubmitVerification}
                    disabled={submittingVerification || !verificationForm.idNumber}
                  >
                    {submittingVerification
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                      : <><ShieldCheck className="mr-2 h-4 w-4" /> Submit for Verification</>
                    }
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Your information is encrypted and only used for identity verification.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AgentDashboard;