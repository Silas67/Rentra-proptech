import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Shield, Users, TrendingUp } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import { mockProperties } from "@/lib/mock-data";
import { Hero } from "@/sections/Hero";
import { Services } from "@/sections/Services";
import { introGridConfig } from "@/config";
import { WhyChooseMe } from "@/sections/WhyChooseMe";
import { FeaturedProjects } from "@/sections/FeaturedProjects";
import { Testimonials } from "@/sections/Testimonials";
import { Footer } from "@/sections/Footer";

const Landing = () => {
  const featured = mockProperties.filter((p) => p.status === "available").slice(0, 3);

  return (
    <div className="min-h-screen scroll">
      {/* Hero */}
      <Hero />

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
                  <h3 className="mb-1 font-semibold font-sans">{item.title}</h3>
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
          <div className="mb-8 flex items-end max-sm:flex-col justify-between">
            <div className="max-w-3xl mx-auto text-center mb-16 md:mb-12">
              <div className="mb-4 group cursor-default flex flex-col items-center justify-center">
                <div className="overflow-hidden">
                  <div
                    className=""
                  >
                    <span className="block text-3xl md:text-4xl lg:text-5xl font-sans font-bold text-softblack tracking-tight">
                      {introGridConfig.titleLine1}
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <div
                    className="text-secondary"
                  >
                    <div className="w-fit block text-3xl md:text-4xl lg:text-5xl font-serif italic font-normal ">
                      {introGridConfig.titleLine2}
                      <p className='w-full scale-x-0 group-hover:scale-x-100 border transition-all origin-left duration-300 border-secondary '></p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-base md:text-sm text-softblack/60 font-body leading-relaxed opacity-100"
              >
                {introGridConfig.description}
              </p>
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

      {/* Services */}
      <Services />

      {/* Why Choose Us */}
      <WhyChooseMe />

      {/* Featured Projects*/}
      <FeaturedProjects />

      {/* Testimonials */}
      <Testimonials />

      {/* CTA */}
      <section className="border-t bg-forest-mid py-16">
        <div className="container text-center">
          <Users className="mx-auto mb-4 h-10 w-10 text-primary-foreground/80" />
          <h2 className="mb-2 text-3xl font-bold text-primary-foreground font-sans">Are you an Agent?</h2>
          <p className="mx-auto mb-6 max-w-md text-primary-foreground/80">
            Generate referral links, track inspections, and earn commissions when tenants rent through you.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
