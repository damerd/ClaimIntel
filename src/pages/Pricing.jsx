import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Building2, Rocket } from "lucide-react";

const TIERS = [
  {
    name: "Free Beta",
    icon: Rocket,
    price: "Free During Beta",
    description: "Get started with ClaimIntel during our beta program.",
    features: [
      "2 full AI-powered claim reviews",
      "Unlimited document uploads for each review",
      "Complete AI claim analysis",
      "Professional report generation",
      "Community support",
      "Early access to future updates",
    ],
    cta: "Start Free Beta",
    ctaLink: "/new-review",
    highlighted: false,
    badge: null,
  },
  {
    name: "Professional",
    icon: Crown,
    price: "Coming Soon",
    description: "For individual adjusters and claim professionals who need full power.",
    features: [
      "Unlimited AI claim reviews",
      "Unlimited document uploads",
      "Advanced liability analysis",
      "Advanced coverage analysis",
      "Venue analysis",
      "Exposure analysis",
      "Settlement strategy recommendations",
      "PDF report exports",
      "Saved claim history",
      "Supervisor Review workflow",
      "Priority feature updates",
    ],
    cta: "Join Waitlist",
    ctaLink: "/request-access",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    icon: Building2,
    price: "Custom Pricing",
    description: "For carriers, TPAs, MGAs, self-insured organizations, law firms, and corporate risk management teams.",
    features: [
      "Team management",
      "Organization dashboards",
      "Client-specific Service Instructions",
      "Custom AI workflows",
      "API integrations",
      "Single Sign-On (SSO)",
      "Dedicated support",
      "Enterprise onboarding",
      "Administrative controls",
      "Audit logging",
    ],
    cta: "Contact Sales",
    ctaLink: "/request-access",
    highlighted: false,
    badge: null,
  },
];

export default function Pricing() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="text-center">
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">ClaimIntel Pricing</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
          Choose the plan that fits your team. Start free during beta and upgrade when you're ready.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {TIERS.map((tier) => (
          <Card
            key={tier.name}
            className={`shadow-sm relative overflow-hidden ${
              tier.highlighted ? "border-accent shadow-lg ring-2 ring-accent/20 md:scale-[1.02]" : ""
            }`}
          >
            {tier.badge && (
              <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                {tier.badge}
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tier.highlighted ? "bg-accent" : "bg-primary/10"}`}>
                  <tier.icon className={`w-4 h-4 ${tier.highlighted ? "text-accent-foreground" : "text-primary"}`} />
                </div>
                <CardTitle className="text-lg">{tier.name}</CardTitle>
              </div>
              <p className="text-2xl font-bold mt-3">{tier.price}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tier.description}</p>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <ul className="space-y-2">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-0">
              <Link to={tier.ctaLink} className="w-full">
                <Button
                  className={`w-full ${tier.highlighted ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
                  variant={tier.highlighted ? "default" : "outline"}
                >
                  {tier.cta}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">
          ClaimIntel is currently in beta. Professional and Enterprise plans are coming soon.
        </p>
      </div>
    </div>
  );
}