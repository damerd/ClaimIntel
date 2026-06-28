import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Users, Mail } from "lucide-react";

export default function PremiumLockScreen() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-lg border-primary/20 overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-8 py-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent mx-auto flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold">Beta Reviews Used</h2>
          <p className="text-sm text-primary-foreground/80 mt-2 max-w-md mx-auto leading-relaxed">
            You've used your two complimentary ClaimIntel Beta reviews. Upgrade to ClaimIntel Professional to continue generating AI-powered claim reviews.
          </p>
        </div>
        <CardContent className="p-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link to="/pricing" className="sm:col-span-3 sm:col-start-1">
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg" size="lg">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Professional
              </Button>
            </Link>
            <Link to="/pricing" className="sm:col-span-3">
              <Button variant="outline" className="w-full" size="lg">
                <Users className="w-4 h-4 mr-2" />
                Join Waitlist
              </Button>
            </Link>
            <Link to="/pricing" className="sm:col-span-3">
              <Button variant="outline" className="w-full" size="lg">
                <Mail className="w-4 h-4 mr-2" />
                Contact Sales
              </Button>
            </Link>
          </div>
          <p className="text-center text-xs text-muted-foreground pt-2">
            ClaimIntel Professional includes unlimited AI claim reviews, advanced analytics, and priority support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}