import { base44 } from "@/api/base44Client";
import { AppError } from "@/lib/appError";

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const ACCEPTED_DOCUMENT_TYPES = {
  "application/pdf": { ext: "PDF", category: "PDF" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { ext: "DOCX", category: "Word" },
  "application/msword": { ext: "DOC", category: "Word" },
  "text/plain": { ext: "TXT", category: "Text" },
  "image/jpeg": { ext: "JPG/JPEG", category: "Image" },
  "image/png": { ext: "PNG", category: "Image" },
};

export function validateDocument(file) {
  if (!ACCEPTED_DOCUMENT_TYPES[file.type]) {
    throw new AppError(`Unsupported document type: ${file.type || "unknown"}`, {
      code: "UNSUPPORTED_DOCUMENT_TYPE",
      userMessage: `${file.name} is not a supported file type. Use PDF, DOC, DOCX, TXT, JPG, JPEG, or PNG.`,
    });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new AppError(`Document exceeds ${MAX_FILE_SIZE_BYTES} bytes`, {
      code: "DOCUMENT_TOO_LARGE",
      userMessage: `${file.name} exceeds the 20 MB file limit.`,
    });
  }
}

export async function extractDocument(file) {
  validateDocument(file);
  if (file.type === "text/plain") {
    return { extractedText: await file.text(), documentType: "text document", statusLabel: "Processed" };
  }

  const { file_url: fileUrl } = await base44.integrations.Core.UploadFile({ file });
  const isImage = ["image/jpeg", "image/png"].includes(file.type);
  if (isImage) {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: "Extract all readable text from this image. Preserve document structure. Do not invent unreadable content. If text is limited, clearly state that extraction quality is limited. Return only extracted text.",
      file_urls: [fileUrl],
    });
    return { extractedText: typeof result === "string" ? result : JSON.stringify(result), documentType: "image", statusLabel: "OCR Complete" };
  }

  const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
    file_url: fileUrl,
    json_schema: {
      type: "object",
      properties: {
        full_text: { type: "string", description: "All readable text, preserving structure where possible." },
        document_type: { type: "string", description: "Document type, if identifiable." },
      },
    },
  });
  if (extracted.status !== "success" || !extracted.output) {
    throw new AppError("Document extraction failed", { code: "EXTRACTION_FAILED", userMessage: `ClaimIntel could not read ${file.name}. Try a clearer copy or paste the text manually.` });
  }
  return {
    extractedText: extracted.output.full_text || JSON.stringify(extracted.output),
    documentType: extracted.output.document_type || null,
    statusLabel: "Processed",
  };
}
