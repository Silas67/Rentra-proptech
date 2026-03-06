import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Shield, Users, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-property.jpg";
import PropertyCard from "@/components/PropertyCard";
import { mockProperties } from "@/lib/mock-data";

const Landing = () => {
  const featured = mockProperties.filter((p) => p.status === "available").slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Modern apartment building" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
        </div>
        <div className="container relative z-10 flex min-h-[85vh] flex-col justify-center py-20">
          <div className="max-w-2xl">
            <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-background sm:text-5xl lg:text-6xl">
              Find Your Perfect <span className="text-secondary">Rental Home</span>
            </h1>
            <p className="mb-8 text-lg text-background/80 sm:text-xl">
              Rentra connects tenants, agents, and landlords on one seamless platform. Browse properties, book inspections, and move in faster.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild className="text-base">
                <Link to="/search"><Search className="mr-2 h-5 w-5" /> Browse Properties</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-background/30 bg-background/10 text-base text-background backdrop-blur-sm hover:bg-background/20 hover:text-background">
                <Link to="/signup">List Your Property</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="border-b py-16">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Search, title: "Easy Search", desc: "Find properties by location, price, and type with powerful filters." },
              { icon: Shield, title: "Verified Listings", desc: "Every property is verified by our team for your peace of mind." },
              { icon: TrendingUp, title: "Agent Referrals", desc: "Agents earn commissions by sharing properties with their network." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-16">
        <div className="container">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold">Featured Properties</h2>
              <p className="mt-1 text-muted-foreground">Handpicked rentals in top locations</p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/search">View all →</Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary py-16">
        <div className="container text-center">
          <Users className="mx-auto mb-4 h-10 w-10 text-primary-foreground/80" />
          <h2 className="mb-2 font-display text-3xl font-bold text-primary-foreground">Are you an Agent?</h2>
          <p className="mx-auto mb-6 max-w-md text-primary-foreground/80">
            Generate referral links, track inspections, and earn commissions when tenants rent through you.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <span className="font-display font-bold text-foreground">Rentra</span>
          <span>© 2024 Rentra. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
