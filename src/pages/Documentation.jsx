import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookOpen, Construction } from "lucide-react";

export default function Documentation() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="text-sm text-muted-foreground mt-1">Guides and resources for using ClaimIntel</p>
      </div>

      <Card className="shadow-sm border-dashed">
        <CardContent className="py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <Construction className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-semibold text-lg">Documentation Coming Soon</h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
            Full documentation, user guides, and video tutorials will be available here as ClaimIntel prepares for official launch.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-4 h-4 text-primary" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {[
              "Navigate to New Analysis from the sidebar.",
              "Enter claim details (name, number, date of loss, jurisdiction, line of business).",
              "Upload supporting documents — police reports, medical records, demand packages, pleadings, and more.",
              "Select the review sections you want included in your report.",
              "Click Generate Intelligence Report to run the AI analysis.",
              "Review the structured report and use the Follow-Up Assistant for additional questions.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}