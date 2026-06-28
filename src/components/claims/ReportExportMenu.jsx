import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, File, FileCode, Loader2 } from "lucide-react";
import { exportAsPDF, exportAsWord, exportAsText } from "@/lib/reportExport";
import { toast } from "sonner";

export default function ReportExportMenu({ review }) {
  const [exporting, setExporting] = useState(null);

  const handleExport = async (format) => {
    setExporting(format);
    try {
      if (format === "pdf") await exportAsPDF(review);
      else if (format === "word") await exportAsWord(review);
      else if (format === "text") await exportAsText(review);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (e) {
      console.error(e);
      toast.error("Export failed", { description: "Please try again." });
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting !== null}>
          {exporting ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5 mr-1.5" />
          )}
          {exporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FileText className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("word")}>
          <File className="w-4 h-4 mr-2" />
          Export as Word (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("text")}>
          <FileCode className="w-4 h-4 mr-2" />
          Export as Text (.txt)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}