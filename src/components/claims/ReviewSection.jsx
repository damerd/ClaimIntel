import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ReviewSection({ title, icon: Icon, content, accentColor }) {
  if (!content) return null;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
          {Icon && (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accentColor || "bg-primary/10"}`}>
              <Icon className={`w-4 h-4 ${accentColor ? "text-white" : "text-primary"}`} />
            </div>
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      </CardContent>
    </Card>
  );
}