import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Property } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2, Upload, ImagePlus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "recharts";

interface AddPropertyModalProps {
    onClose: () => void;
    onAdded: (property: Property) => void;
}

const AMENITIES_OPTIONS = [
    "WiFi", "Parking", "Generator", "Security", "Water",
    "Air Conditioning", "Furnished", "Pool", "Gym", "Balcony",
];

const AddPropertyModal = ({ onClose, onAdded }: AddPropertyModalProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [imageFiles, setImageFiles] = useState<{ file: File; preview: string }[]>([]);
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
        agencyFee: "10",
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;

        const MAX = 5;
        const remaining = MAX - imageFiles.length - uploadedUrls.length;
        if (remaining <= 0) {
            toast({ title: "Maximum 5 images allowed", variant: "destructive" });
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
                toast({ title: `Failed to upload ${file.name}`, variant: "destructive" });
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

    const handleSubmit = async () => {
        if (!user) return;

        console.log("1. Submit triggered, user:", user)

        if (!form.title || !form.price || !form.location || !form.city || !form.state || !form.address) {
            toast({ title: "Please fill in all required fields", variant: "destructive" });
            return;
        }

        setLoading(true);
        const images = await uploadImages();

        console.log("2. Images uploaded:", images)

        const { data, error } = await supabase
            .from("properties")
            .insert({
                title: form.title,
                price: Number(form.price),
                location: form.location,
                city: form.city,
                state: form.state,
                address: form.address,
                landlord_id: user.id,
                description: form.description,
                currency: form.currency,
                bedrooms: Number(form.bedrooms) || 0,
                bathrooms: Number(form.bathrooms) || 0,
                type: form.type,
                status: form.status,
                images,
                amenities: form.amenities,
                listing_type: form.listingType,
            })
            .select()
            .single();

        console.log("Result:", { data, error });
        setLoading(false);

        if (error) {
            console.error("Error adding property:", error);
            toast({ title: "Failed to add property", description: error.message, variant: "destructive" });
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
        };

        toast({ title: "Property added successfully! 🎉" });
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
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-muted transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-6 p-6">

                    {/* Listing Type Toggle — first thing landlord sees */}
                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Listing Type</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setForm((prev) => ({ ...prev, listingType: "rent", status: "available" }))}
                                className={`rounded-xl border-2 p-4 text-left transition-all ${isRent
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-muted-foreground"
                                    }`}
                            >
                                <p className={`font-semibold ${isRent ? "text-primary" : ""}`}>For Rent</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Tenants pay annually or monthly</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm((prev) => ({ ...prev, listingType: "sale", status: "available" }))}
                                className={`rounded-xl border-2 p-4 text-left transition-all ${!isRent
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-muted-foreground"
                                    }`}
                            >
                                <p className={`font-semibold ${!isRent ? "text-primary" : ""}`}>For Sale</p>
                                <p className="text-xs text-muted-foreground mt-0.5">One-time purchase price</p>
                            </button>
                        </div>
                    </section>

                    {/* Basic Info */}
                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Basic Info</h3>
                        <Input placeholder="Property title *" value={form.title} onChange={(e) => set("title", e.target.value)} />
                        <textarea
                            placeholder="Description"
                            value={form.description}
                            onChange={(e) => set("description", e.target.value)}
                            rows={3}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </section>

                    {/* Pricing — label changes based on listing type */}
                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pricing</h3>
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
                    </section>


                    {/* Agency Fee */}
                    <div className="space-y-1">
                        <Label>Agency Fee % <span className="text-muted-foreground text-xs">(NIESV cap is 10%)</span></Label>
                        <div className="relative">
                            <Input
                                type="number"
                                min="0"
                                max="30"
                                placeholder="10"
                                value={form.agencyFee}
                                onChange={(e) => set("agencyFee", e.target.value)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                        </div>
                        {Number(form.agencyFee) > 10 && (
                            <p className="text-xs text-yellow-600">⚠️ This exceeds the NIESV-approved 10% cap</p>
                        )}
                    </div>

                    {/* Location */}
                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Location</h3>
                        <Input placeholder="Address *" value={form.address} onChange={(e) => set("address", e.target.value)} />
                        <div className="grid grid-cols-2 gap-3">
                            <Input placeholder="City *" value={form.city} onChange={(e) => set("city", e.target.value)} />
                            <Input placeholder="State *" value={form.state} onChange={(e) => set("state", e.target.value)} />
                        </div>
                        <Input placeholder="Area / Neighbourhood *" value={form.location} onChange={(e) => set("location", e.target.value)} />
                    </section>

                    {/* Details */}
                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Details</h3>
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
                            <Input placeholder="Bedrooms" type="number" min="0" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
                            <Input placeholder="Bathrooms" type="number" min="0" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} />
                        </div>
                    </section>

                    {/* Amenities */}
                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                            {AMENITIES_OPTIONS.map((amenity) => (
                                <button
                                    key={amenity}
                                    type="button"
                                    onClick={() => toggleAmenity(amenity)}
                                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${form.amenities.includes(amenity)
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-background hover:bg-muted"
                                        }`}
                                >
                                    {amenity}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Images */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                Images <span className="normal-case font-normal">({totalImages}/5)</span>
                            </h3>
                            {totalImages < 5 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                                >
                                    <ImagePlus className="h-4 w-4" />
                                    Add images
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
                                    <div key={`uploaded-${i}`} className="relative group aspect-video rounded-lg overflow-hidden border">
                                        <img src={url} alt="" className="w-full h-full object-cover" />
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
                                    <div key={`pending-${i}`} className="relative group aspect-video rounded-lg overflow-hidden border">
                                        <img src={preview} alt={file.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20 flex items-end p-1">
                                            <span className="text-xs text-white truncate">{file.name}</span>
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
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading images...
                            </div>
                        )}
                    </section>

                </div>

                {/* Footer */}
                <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-card px-6 py-4">
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading || uploadingImages}>
                        {loading
                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{uploadingImages ? "Uploading..." : "Adding..."}</>
                            : "Add Property"
                        }
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default AddPropertyModal;