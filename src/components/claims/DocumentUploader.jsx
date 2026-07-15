import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload, FileText, FileImage, File, X, CheckCircle2,
  Loader2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { extractDocument, validateDocument } from "@/services/documentProcessingService";
import { normalizeError } from "@/lib/appError";

const ACCEPTED_TYPES = {
  "application/pdf": { ext: "PDF", icon: FileText, color: "text-red-500" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { ext: "DOCX", icon: FileText, color: "text-blue-500" },
  "application/msword": { ext: "DOC", icon: FileText, color: "text-blue-500" },
  "text/plain": { ext: "TXT", icon: FileText, color: "text-slate-500" },
  "image/jpeg": { ext: "JPG/JPEG", icon: FileImage, color: "text-emerald-500" },
  "image/png": { ext: "PNG", icon: FileImage, color: "text-emerald-500" },
};

const ACCEPT_STRING = ".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png";

function getDocTypeLabel(mimeType) {
  return ACCEPTED_TYPES[mimeType]?.ext || "FILE";
}

function getIcon(mimeType) {
  const def = ACCEPTED_TYPES[mimeType];
  if (!def) return File;
  return def.icon;
}

function getIconColor(mimeType) {
  return ACCEPTED_TYPES[mimeType]?.color || "text-slate-400";
}

function countByType(docs) {
  const counts = { PDF: 0, Word: 0, Image: 0, Text: 0 };
  docs.forEach((d) => {
    if (d.mimeType === "application/pdf") counts.PDF++;
    else if (d.mimeType === "application/msword" || d.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") counts.Word++;
    else if (d.mimeType === "image/jpeg" || d.mimeType === "image/png") counts.Image++;
    else if (d.mimeType === "text/plain") counts.Text++;
  });
  return counts;
}

export default function DocumentUploader({ onTextChange, onDocumentsChange }) {
  const [documents, setDocuments] = useState([]);
  const [manualText, setManualText] = useState("");
  const inputRef = useRef();

  const updateDocuments = (newDocs) => {
    setDocuments(newDocs);
    onDocumentsChange?.(newDocs);
    rebuildCombinedText(newDocs, manualText);
  };

  const rebuildCombinedText = (docs, extra) => {
    const parts = [];
    docs.forEach((doc) => {
      if (doc.extractedText) {
        parts.push(`=== DOCUMENT: ${doc.name} (${getDocTypeLabel(doc.mimeType)}) ===\n${doc.extractedText}`);
      }
    });
    if (extra.trim()) parts.push(`=== ADDITIONAL NOTES / PASTED TEXT ===\n${extra}`);
    onTextChange(parts.join("\n\n"));
  };

  const handleManualTextChange = (e) => {
    const val = e.target.value;
    setManualText(val);
    rebuildCombinedText(documents, val);
  };

  const processFile = async (file) => {
    try {
      validateDocument(file);
    } catch (error) {
      const normalized = normalizeError(error, `Could not add ${file.name}.`);
      toast.error("Document not accepted", { description: normalized.userMessage });
      return;
    }

    const docEntry = {
      id: crypto.randomUUID(),
      name: file.name,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      status: "uploading",
      extractedText: "",
      errorCode: null,
    };

    const updateDoc = (id, patch) => {
      setDocuments((prev) => {
        const next = prev.map((doc) => (doc.id === id ? { ...doc, ...patch } : doc));
        onDocumentsChange?.(next);
        rebuildCombinedText(next, manualText);
        return next;
      });
    };

    setDocuments((prev) => {
      const next = [...prev, docEntry];
      onDocumentsChange?.(next);
      return next;
    });

    try {
      updateDoc(docEntry.id, { status: "extracting" });
      const result = await extractDocument(file);
      updateDoc(docEntry.id, { status: "processed", ...result });
    } catch (error) {
      const normalized = normalizeError(error, `ClaimIntel could not process ${file.name}.`);
      updateDoc(docEntry.id, { status: "error", errorCode: normalized.code, errorMessage: normalized.userMessage });
      toast.error("Document processing failed", { description: normalized.userMessage });
    }
  };

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(processFile);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(processFile);
  };

  const removeDocument = (id) => {
    setDocuments((prev) => {
      const next = prev.filter((d) => d.id !== id);
      onDocumentsChange?.(next);
      rebuildCombinedText(next, manualText);
      return next;
    });
  };

  const typeCounts = countByType(documents.filter((d) => d.status === "processed"));
  const allProcessed = documents.length > 0 && documents.every((d) => d.status === "processed" || d.status === "error");

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Claim File Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/40 rounded-xl p-8 text-center cursor-pointer transition-colors"
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT_STRING}
            className="hidden"
            onChange={handleFilesSelected}
          />
          <div className="flex justify-center mb-3 gap-2">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-500" />
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <FileImage className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <p className="font-semibold text-sm text-foreground">Upload Claim Documents</p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, DOCX, DOC, TXT, JPG, JPEG, PNG
          </p>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-sm mx-auto">
            Demand letters · Medical records · Police reports · Claim notes · Litigation reports · Photographs · Coverage correspondence
          </p>
          <Button variant="outline" size="sm" className="mt-4 pointer-events-none">
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Choose Files or Drop Here
          </Button>
        </div>

        {/* Document List */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Uploaded Documents</p>
            {documents.map((doc) => {
              const Icon = getIcon(doc.mimeType);
              const iconColor = getIconColor(doc.mimeType);
              return (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{getDocTypeLabel(doc.mimeType)}</span>
                      {doc.documentType && (
                        <>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground capitalize">{doc.documentType}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(doc.status === "uploading" || doc.status === "extracting") && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {doc.status === "uploading" ? "Uploading..." : "Processing..."}
                      </span>
                    )}
                    {doc.status === "processed" && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {doc.statusLabel || "Processed"}
                      </span>
                    )}
                    {doc.status === "error" && (
                      <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Failed
                      </span>
                    )}
                    {doc.status === "error" && doc.errorMessage && (
                      <span className="sr-only">{doc.errorMessage}</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeDocument(doc.id); }}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Document Summary */}
        {allProcessed && documents.length > 0 && (
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Documents Uploaded</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {typeCounts.PDF > 0 && <span className="text-xs text-muted-foreground">{typeCounts.PDF} PDF{typeCounts.PDF > 1 ? "s" : ""}</span>}
              {typeCounts.Word > 0 && <span className="text-xs text-muted-foreground">{typeCounts.Word} Word Document{typeCounts.Word > 1 ? "s" : ""}</span>}
              {typeCounts.Image > 0 && <span className="text-xs text-muted-foreground">{typeCounts.Image} Image{typeCounts.Image > 1 ? "s" : ""}</span>}
              {typeCounts.Text > 0 && <span className="text-xs text-muted-foreground">{typeCounts.Text} Text File{typeCounts.Text > 1 ? "s" : ""}</span>}
            </div>
            <p className="text-xs font-medium text-foreground">
              Total Documents: {documents.filter((d) => d.status === "processed").length}
            </p>
          </div>
        )}

        {/* Divider + Manual paste */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or paste additional text</span>
          </div>
        </div>

        <textarea
          value={manualText}
          onChange={handleManualTextChange}
          placeholder="Paste any additional claim notes or text here..."
          className="w-full min-h-[120px] font-mono text-xs leading-relaxed rounded-md border border-input bg-transparent px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
        />

        {(documents.some((d) => d.status === "processed") || manualText.trim()) && (
          <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Claim file ready for analysis
          </p>
        )}
      </CardContent>
    </Card>
  );
}