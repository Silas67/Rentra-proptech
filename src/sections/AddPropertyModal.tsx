import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Property } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, Upload, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface AddPropertyModalProps {
  onClose: () => void;
  onAdded: (property: Property) => void;
}

const AMENITIES_OPTIONS = [
  "WiFi",
  "Parking",
  "Generator",
  "Security",
  "Water",
  "Air Conditioning",
  "Furnished",
  "Pool",
  "Gym",
  "Balcony",
];

const AddPropertyModal = ({ onClose, onAdded }: AddPropertyModalProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const floorPlanRef = useRef<HTMLInputElement>(null);

  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingFloorPlan, setUploadingFloorPlan] = useState(false);
  const [imageFiles, setImageFiles] = useState<
    { file: File; preview: string }[]
  >([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    currency: "NGN",
    listingType: "rent" as "rent" | "sale",
    location: "",
    city: "",
    state: "",
    address: "",
    bedrooms: "",
    bathrooms: "",
    hasGenerator: false,
    hasWater: false,
    hasSecurity: false,
    powerHours: "",
    agencyFee: "10",
    floorPlanUrl: "",
    type: "apartment" as Property["type"],
    status: "available" as Property["status"],
    amenities: [] as string[],
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  // ✨ AI Description Generator
  const handleGenerateDescription = async () => {
    if (!form.title || !form.type || !form.city) {
      toast.error("Fill in title, type and city first");
      return;
    }

    setGeneratingDesc(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Write a professional Nigerian real estate listing description for this property. Keep it under 150 words, factual, and appealing to tenants. Do not invent details not provided.

Property details:
- Title: ${form.title}
- Type: ${form.type}
- City: ${form.city}, ${form.state}
- Location/Area: ${form.location}
- Bedrooms: ${form.bedrooms}
- Bathrooms: ${form.bathrooms}
- Listing type: ${form.listingType === "rent" ? "For Rent" : "For Sale"}
- Price: ${form.currency}${form.price}${form.listingType === "rent" ? "/year" : ""}
- Amenities: ${form.amenities.join(", ") || "None listed"}
- Generator: ${form.hasGenerator ? "Yes" : "No"}
- Water: ${form.hasWater ? "Yes" : "No"}
- Security: ${form.hasSecurity ? "Yes" : "No"}

Write only the description, no title or labels.`,
            },
          ],
        }),
      });

      const data = await response.json();
      const description = data.content?.[0]?.text ?? "";
      setForm((prev) => ({ ...prev, description }));
      toast.success("Description generated! Feel free to edit it.");
    } catch (err) {
      toast.error("Failed to generate description. Try again.");
    }

    setGeneratingDesc(false);
  };

  // 🖼️ Image selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const MAX = 5;
    const remaining = MAX - imageFiles.length - uploadedUrls.length;
    if (remaining <= 0) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    const selected = files.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImageFiles((prev) => [...prev, ...selected]);
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeUploadedUrl = (index: number) => {
    setUploadedUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // 🔄 Reorder images
  const moveImage = (index: number, direction: "left" | "right") => {
    setImageFiles((prev) => {
      const updated = [...prev];
      const swapIndex = direction === "left" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= updated.length) return prev;
      [updated[index], updated[swapIndex]] = [
        updated[swapIndex],
        updated[index],
      ];
      return updated;
    });
  };

  // ☁️ Upload images to Supabase Storage
  const uploadImages = async (): Promise<string[]> => {
    if (!imageFiles.length) return uploadedUrls;

    setUploadingImages(true);
    const urls: string[] = [...uploadedUrls];

    for (const { file } of imageFiles) {
      const ext = file.name.split(".").pop();
      const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("property-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (error) {
        console.error("Image upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("property-images")
        .getPublicUrl(fileName);

      urls.push(urlData.publicUrl);
    }

    setUploadingImages(false);
    return urls;
  };

  // 🏠 Floor plan upload
  const handleFloorPlanUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingFloorPlan(true); // ✅ show loading
    const ext = file.name.split(".").pop();
    const fileName = `${user.id}/floorplan-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("property-images")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (!error) {
      const { data: urlData } = supabase.storage
        .from("property-images")
        .getPublicUrl(fileName);
      setForm((p) => ({ ...p, floorPlanUrl: urlData.publicUrl }));
      toast.success("Floor plan uploaded!");
    } else {
      toast.error("Failed to upload floor plan");
    }
    setUploadingFloorPlan(false); // ✅ hide loading
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (
      !form.title ||
      !form.price ||
      !form.location ||
      !form.city ||
      !form.state ||
      !form.address
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    const images = await uploadImages();

    const { data, error } = await supabase
      .from("properties")
      .insert({
        title: form.title,
        description: form.description,
        price: Number(form.price),
        currency: form.currency,
        listing_type: form.listingType,
        location: form.location,
        city: form.city,
        state: form.state,
        address: form.address,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        type: form.type,
        status: form.status,
        images,
        amenities: form.amenities,
        landlord_id: user.id,
        has_generator: form.hasGenerator,
        has_water: form.hasWater,
        has_security: form.hasSecurity,
        power_hours: Number(form.powerHours) || 0,
        agency_fee: Number(form.agencyFee) || 10,
        floor_plan_url: form.floorPlanUrl || null,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error("Error adding property:", error);
      toast.error(`Failed to add property: ${error.message}`);
      return;
    }

    const newProperty: Property = {
      id: data.id,
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency,
      listingType: data.listing_type,
      location: data.location,
      city: data.city,
      state: data.state,
      address: data.address,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      type: data.type,
      status: data.status,
      images: data.images ?? [],
      amenities: data.amenities ?? [],
      landlordId: data.landlord_id,
      agentId: data.agent_id,
      createdAt: data.created_at,
      hasGenerator: data.has_generator,
      hasWater: data.has_water,
      hasSecurity: data.has_security,
      powerHours: data.power_hours,
      agencyFee: data.agency_fee,
      floorPlanUrl: data.floor_plan_url,
    };

    toast.success("Property added successfully! 🎉");
    onAdded(newProperty);
    onClose();
  };

  const totalImages = imageFiles.length + uploadedUrls.length;
  const isRent = form.listingType === "rent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-6 py-4">
          <h2 className="font-display text-xl font-bold">Add New Property</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Listing Type */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Listing Type
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    listingType: "rent",
                    status: "available",
                  }))
                }
                className={`rounded-xl border-2 p-4 text-left transition-all ${isRent ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}
              >
                <p className={`font-semibold ${isRent ? "text-primary" : ""}`}>
                  For Rent
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tenants pay annually or monthly
                </p>
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    listingType: "sale",
                    status: "available",
                  }))
                }
                className={`rounded-xl border-2 p-4 text-left transition-all ${!isRent ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}
              >
                <p className={`font-semibold ${!isRent ? "text-primary" : ""}`}>
                  For Sale
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  One-time purchase price
                </p>
              </button>
            </div>
          </section>

          {/* Basic Info */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Basic Info
            </h3>
            <Input
              placeholder="Property title *"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={generatingDesc}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50"
            >
              {generatingDesc ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Generating...
                </>
              ) : (
                <>✨ Generate with AI</>
              )}
            </button>
          </section>

          {/* Pricing */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Pricing
            </h3>
            <div className="flex gap-3">
              <select
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="NGN">₦ NGN</option>
                <option value="USD">$ USD</option>
              </select>
              <div className="relative flex-1">
                <Input
                  placeholder={isRent ? "Price per year *" : "Sale price *"}
                  type="number"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  {isRent ? "/yr" : "once"}
                </span>
              </div>
            </div>

            {/* Agency Fee */}
            <div className="space-y-1">
              <Label htmlFor="agencyFee">
                Agency Fee %{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  (NIESV cap is 10%)
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="agencyFee"
                  type="number"
                  min="0"
                  max="30"
                  placeholder="10"
                  value={form.agencyFee}
                  onChange={(e) => set("agencyFee", e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  %
                </span>
              </div>
              {Number(form.agencyFee) > 10 && (
                <p className="text-xs text-yellow-600">
                  ⚠️ This exceeds the NIESV-approved 10% cap
                </p>
              )}
            </div>
          </section>

          {/* Location */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Location
            </h3>
            <Input
              placeholder="Address *"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="City *"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
              <Input
                placeholder="State *"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
              />
            </div>
            <Input
              placeholder="Area / Neighbourhood *"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </section>

          {/* Details */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="studio">Studio</option>
                  <option value="duplex">Duplex</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  {isRent ? (
                    <option value="rented">Rented</option>
                  ) : (
                    <option value="sold">Sold</option>
                  )}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Bedrooms"
                type="number"
                min="0"
                value={form.bedrooms}
                onChange={(e) => set("bedrooms", e.target.value)}
              />
              <Input
                placeholder="Bathrooms"
                type="number"
                min="0"
                value={form.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)}
              />
            </div>
          </section>

          {/* Amenities */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Amenities
            </h3>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_OPTIONS.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    form.amenities.includes(amenity)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </section>

          {/* Utilities & Security */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Utilities & Security
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "hasGenerator", label: "Generator", icon: "⚡" },
                { key: "hasWater", label: "Water Supply", icon: "💧" },
                { key: "hasSecurity", label: "Security", icon: "🔒" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      [item.key]: !prev[item.key as keyof typeof prev],
                    }))
                  }
                  className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                    form[item.key as keyof typeof form]
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <span>{item.icon}</span> {item.label}
                </button>
              ))}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Power Hours/Day
                </label>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  placeholder="e.g. 12"
                  value={form.powerHours}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, powerHours: e.target.value }))
                  }
                />
              </div>
            </div>
          </section>

          {/* Images */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Images{" "}
                <span className="normal-case font-normal">
                  ({totalImages}/5)
                </span>
              </h3>
              {totalImages < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ImagePlus className="h-4 w-4" /> Add images
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {totalImages > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {uploadedUrls.map((url, i) => (
                  <div
                    key={`uploaded-${i}`}
                    className="relative group aspect-video rounded-lg overflow-hidden border"
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeUploadedUrl(i)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {imageFiles.map(({ preview, file }, i) => (
                  <div
                    key={`pending-${i}`}
                    className="relative group aspect-video rounded-lg overflow-hidden border"
                  >
                    <img
                      src={preview}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Cover badge */}
                    {i === 0 && (
                      <span className="absolute top-1 left-1 rounded bg-primary/80 px-1.5 py-0.5 text-xs text-white">
                        Cover
                      </span>
                    )}

                    {/* Reorder buttons */}
                    <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {i > 0 && (
                        <button
                          type="button"
                          onClick={() => moveImage(i, "left")}
                          className="rounded bg-black/60 px-1.5 py-0.5 text-white text-xs"
                        >
                          ←
                        </button>
                      )}
                      {i < imageFiles.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveImage(i, "right")}
                          className="rounded bg-black/60 px-1.5 py-0.5 text-white text-xs"
                        >
                          →
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {totalImages < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-xs">Add more</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-2 text-muted-foreground hover:bg-muted transition-colors"
              >
                <Upload className="h-8 w-8 opacity-50" />
                <p className="text-sm font-medium">Click to upload images</p>
                <p className="text-xs">PNG, JPG, WEBP — up to 5 images</p>
              </button>
            )}

            {uploadingImages && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading images...
              </div>
            )}
          </section>

          {/* Floor Plan */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Floor Plan{" "}
              <span className="normal-case font-normal text-muted-foreground">
                (optional)
              </span>
            </h3>

            {form.floorPlanUrl ? (
              <div className="relative group rounded-xl overflow-hidden border">
                <img
                  src={form.floorPlanUrl}
                  alt="Floor plan"
                  className="w-full object-contain max-h-48"
                />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, floorPlanUrl: "" }))}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => floorPlanRef.current?.click()}
                disabled={uploadingFloorPlan}
                className="w-full rounded-xl border-2 border-dashed p-6 flex flex-col items-center gap-2 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                {uploadingFloorPlan ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin opacity-50" />
                    <p className="text-sm">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 opacity-50" />
                    <p className="text-sm">Upload floor plan</p>
                    <p className="text-xs">PNG, JPG — 1 image</p>
                  </>
                )}
              </button>
            )}

            <input
              ref={floorPlanRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFloorPlanUpload}
            />
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-card px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadingImages ? "Uploading..." : "Adding..."}
              </>
            ) : (
              "Add Property"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddPropertyModal;
