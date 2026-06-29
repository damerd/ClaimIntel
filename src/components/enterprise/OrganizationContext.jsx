import { useUserRole } from "@/hooks/useUserRole";
import { Building2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function OrganizationContext() {
  const { showOrgContext, organizationName, clientAccountName } = useUserRole();

  if (!showOrgContext) return null;

  return (
    <div className="border-b bg-card px-4 md:px-8 py-2 flex items-center gap-2">
      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-xs font-medium text-foreground">{organizationName}</span>
      {clientAccountName && (
        <>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{clientAccountName}</span>
        </>
      )}
      <Badge variant="outline" className="text-[10px] ml-1 bg-primary/5">Enterprise Workspace</Badge>
    </div>
  );
}