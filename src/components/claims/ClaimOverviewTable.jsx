import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getClaimOverview } from "@/lib/reportContent";

export default function ClaimOverviewTable({ review }) {
  const fields = getClaimOverview(review);
  if (fields.length === 0) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Claim Overview</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {fields.map((field, i) => (
                <tr key={field.label} className={i % 2 === 0 ? "bg-muted/30" : "bg-transparent"}>
                  <td className="px-4 py-2.5 font-semibold text-muted-foreground w-1/3 border-b border-border last:border-0">
                    {field.label}
                  </td>
                  <td className="px-4 py-2.5 text-foreground border-b border-border last:border-0">
                    {field.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}