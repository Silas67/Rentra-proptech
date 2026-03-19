import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mockProperties } from "@/lib/mock-data";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BookInspection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const property = mockProperties.find((p) => p.id === id);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    date: "",
    time: "",
  });

  const [loading, setLoading] = useState(false);

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Property not found</p>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.date || !form.time) {
      toast({
        title: "Missing fields",
        description: "Please select a date and time.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 🔥 Replace this with your real API endpoint
      const res = await fetch("/api/book-inspection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId: id,
          ...form,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to book inspection");
      }

      toast({
        title: "Inspection booked!",
        description: `You're set for ${form.date} at ${form.time}.`,
      });

      navigate(`/property/${id}`);
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Couldn't complete booking. Try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-6">
      <div className="container max-w-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-display text-xl font-bold">
                Book an Inspection
              </h1>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {property.title}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date">Preferred Date</Label>
                <Input
                  id="date"
                  type="date"
                  min={today}
                  value={form.date}
                  onChange={(e) =>
                    setForm({ ...form, date: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="time">Preferred Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={form.time}
                  onChange={(e) =>
                    setForm({ ...form, time: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookInspection;