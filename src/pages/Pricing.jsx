import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Building2, Rocket, Server, Wrench, Brain, ShieldCheck, Plug, Headphones } from "lucide-react";

const ENTERPRISE_FEATURES = [
  {
    icon: Server,
    title: "Enterprise Deployment",
    description: "Deploy ClaimIntel across your organization with centralized administration, user management, role-based permissions, and configurable workflows designed for enterprise claims operations.",
  },
  {
    icon: Wrench,
    title: "Dedicated Implementation",
    description: "Work directly with the ClaimIntel team to configure AI workflows, report templates, client-specific requirements, and organizational preferences.",
  },
  {
    icon: Brain,
    title: "Client-Specific Intelligence",
    description: "Create organization-specific Service Instructions, reporting requirements, authority guidelines, coverage workflows, and custom AI behavior tailored to your claims operation.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    description: "Provide enterprise-grade security including secure authentication, encrypted document handling, role-based access control, audit logging, and complete organizational data separation.",
  },
  {
    icon: Plug,
    title: "Integrations",
    description: "Support integrations with claims management systems, document repositories, APIs, and enterprise workflows to eliminate duplicate work and improve efficiency.",
  },
  {
    icon: Headphones,
    title: "Premium Support",
    description: "Offer priority support, onboarding assistance, administrator training, roadmap collaboration, and a dedicated customer success experience.",
  },
];

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
    price: "Launching Soon",
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
        <p className="text-sm font-semibold text-muted-foreground mt-2">Smarter Claims. Better Decisions.</p>
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
          ClaimIntel is currently in beta. Professional and Enterprise plans are launching soon.
        </p>
      </div>

      {/* Enterprise Section */}
      <div className="pt-8">
        <div className="text-center mb-8">
          <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">Enterprise Solutions</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto leading-relaxed">
            Built for insurance carriers, TPAs, MGAs, independent adjusting firms, self-insured organizations, law firms, and enterprise claims teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ENTERPRISE_FEATURES.map((feature, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Enterprise CTA */}
      <Card className="shadow-lg border-primary/20 overflow-hidden mt-8">
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-8 py-10 text-center">
          <h2 className="font-heading text-2xl font-bold">Ready to Bring AI to Your Claims Organization?</h2>
          <p className="text-sm text-primary-foreground/80 mt-3 max-w-xl mx-auto leading-relaxed">
            Schedule a personalized demonstration to see how ClaimIntel can streamline claim reviews, improve consistency, reduce review time, and help your organization make faster, better-informed claim decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Link to="/request-access">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg" size="lg">
                Schedule a Demo
              </Button>
            </Link>
            <Link to="/request-access">
              <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}