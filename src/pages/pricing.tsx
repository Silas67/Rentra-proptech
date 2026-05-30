import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X } from "lucide-react";

const PLANS = [
    {
        key: "free",
        name: "Free",
        price: 0,
        description: "Get started on Rentra",
        color: "border-border",
        features: [
            { text: "3 active listings", included: true },
            { text: "Basic storefront page", included: true },
            { text: "In-app messaging", included: true },
            { text: "1 inspection booking/month", included: true },
            { text: "Storefront analytics", included: false },
            { text: "CRM pipeline", included: false },
            { text: "WhatsApp lead routing", included: false },
            { text: "Verified agent badge", included: false },
        ],
    },
    {
        key: "starter",
        name: "Starter",
        price: 5000,
        description: "For active solo agents",
        color: "border-primary",
        highlight: false,
        features: [
            { text: "25 active listings", included: true },
            { text: "Full storefront + analytics", included: true },
            { text: "Unlimited inspection bookings", included: true },
            { text: "CRM pipeline", included: true },
            { text: "WhatsApp lead routing", included: true },
            { text: "Verified agent badge processing", included: true },
            { text: "Boosted listings", included: false },
            { text: "Area specialist tags", included: false },
        ],
    },
    {
        key: "pro",
        name: "Pro",
        price: 18000,
        description: "For serious agents",
        color: "border-primary",
        highlight: true,
        features: [
            { text: "100 active listings", included: true },
            { text: "10 boosted listings/month", included: true },
            { text: "Full storefront + analytics", included: true },
            { text: "CRM + reminders", included: true },
            { text: "WhatsApp lead routing", included: true },
            { text: "Verified agent badge", included: true },
            { text: "Area specialist tags", included: true },
            { text: "Attribution split dashboard", included: true },
        ],
    },
    {
        key: "agency",
        name: "Agency",
        price: 45000,
        description: "For agencies and teams",
        color: "border-border",
        features: [
            { text: "300 active listings", included: true },
            { text: "30 boosted listings/month", included: true },
            { text: "Multi-agent team management", included: true },
            { text: "Custom subdomain", included: true },
            { text: "Priority support", included: true },
            { text: "All Pro features included", included: true },
            { text: "Branded storefront", included: true },
            { text: "Advanced analytics", included: true },
        ],
    },
];

const Pricing = () => {
    return (
        <div className="min-h-screen pb-20">

            {/* Header */}
            <div className="py-16 text-center">
                <h1 className="font-display text-4xl font-bold">Simple, Transparent Pricing</h1>
                <p className="mt-3 text-muted-foreground max-w-md mx-auto">
                    No hidden fees. No pay-to-rank auctions. Just tools that help you close deals.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                    Pay month-to-month. Cancel anytime. No minimum commitment.
                </p>
            </div>

            {/* Plans */}
            <div className="container">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.key}
                            className={`relative rounded-2xl border-2 bg-card p-6 shadow-sm flex flex-col ${plan.color} ${plan.highlight ? "ring-2 ring-primary ring-offset-2" : ""
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h2 className="font-display text-xl font-bold">{plan.name}</h2>
                                <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
                                <div className="mt-4">
                                    {plan.price === 0 ? (
                                        <p className="text-3xl font-bold">Free</p>
                                    ) : (
                                        <div>
                                            <p className="text-3xl font-bold">
                                                ₦{plan.price.toLocaleString()}
                                                <span className="text-base font-normal text-muted-foreground">/mo</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Features */}
                            <div className="flex-1 space-y-2.5 mb-6">
                                {plan.features.map((f) => (
                                    <div key={f.text} className="flex items-start gap-2">
                                        {f.included
                                            ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                            : <X className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                                        }
                                        <span className={`text-sm ${f.included ? "" : "text-muted-foreground/60"}`}>
                                            {f.text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                className="w-full"
                                variant={plan.highlight ? "default" : "outline"}
                                asChild
                            >
                                <Link to={plan.price === 0 ? "/signup" : `/signup?plan=${plan.key}`}>
                                    {plan.price === 0 ? "Get Started Free" : `Start ${plan.name}`}
                                </Link>
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Pay-as-you-go section */}
                <div className="mt-16">
                    <h2 className="text-center font-display text-2xl font-bold mb-2">Pay As You Go</h2>
                    <p className="text-center text-muted-foreground text-sm mb-8">
                        One-time purchases on top of any plan
                    </p>
                    <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
                        {[
                            {
                                name: "Boosted Listing",
                                price: "₦2,500",
                                period: "per listing / 7 days",
                                description: "Push your listing to the top of search results for 7 days",
                            },
                            {
                                name: "Rentra-Verified Tag",
                                price: "₦7,500",
                                period: "per listing / 60 days",
                                description: "Our team physically verifies your listing and adds a trust badge",
                            },
                            {
                                name: "Verified Inspection Pass",
                                price: "₦15,000",
                                period: "per inspection",
                                description: "Held in escrow — refunded if property doesn't match or agent no-shows",
                            },
                        ].map((item) => (
                            <div key={item.name} className="rounded-xl border bg-card p-5 space-y-2">
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-2xl font-bold text-primary">{item.price}</p>
                                <p className="text-xs text-muted-foreground">{item.period}</p>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ */}
                <div className="mt-16 max-w-2xl mx-auto">
                    <h2 className="text-center font-display text-2xl font-bold mb-8">Common Questions</h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "Do you charge commission on deals?",
                                a: "Only on deals we can prove were attributed to a Rentra storefront link — and only 5–10% of the agent's commission, not the full deal value.",
                            },
                            {
                                q: "Can I cancel anytime?",
                                a: "Yes. No minimum commitment, no cancellation fees. You keep access until the end of your paid month.",
                            },
                            {
                                q: "Why is your pricing transparent?",
                                a: "Because PropertyPro hides their prices behind a sales call. We think agents deserve to know exactly what they're paying before signing up.",
                            },
                            {
                                q: "What's the difference between Boosted and Rentra-Verified?",
                                a: "Boosted just moves your listing higher in search. Rentra-Verified means our team physically visited the property — it carries a trust badge that tells tenants the listing is real.",
                            },
                        ].map((faq) => (
                            <div key={faq.q} className="rounded-xl border bg-card p-5 space-y-1">
                                <p className="font-semibold">{faq.q}</p>
                                <p className="text-sm text-muted-foreground">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Pricing;