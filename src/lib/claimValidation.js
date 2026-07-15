const REQUIRED_FIELDS = [
  ["claim_name", "Claim name"],
  ["claim_number", "Claim number"],
  ["date_of_loss", "Date of loss"],
  ["jurisdiction", "Jurisdiction"],
  ["line_of_business", "Line of business"],
  ["claim_file_text", "Claim file text or processed documents"],
];

export function validateClaimReview({ form, selectedSections, documents = [] }) {
  const blocking = [];
  const warnings = [];

  for (const [field, label] of REQUIRED_FIELDS) {
    if (!String(form?.[field] || "").trim()) blocking.push(`${label} is required.`);
  }
  if (!selectedSections?.length) blocking.push("Select at least one report section.");

  const processing = documents.filter((doc) => ["uploading", "extracting"].includes(doc.status));
  const failed = documents.filter((doc) => doc.status === "error");
  if (processing.length) blocking.push(`Wait for ${processing.length} document${processing.length === 1 ? "" : "s"} to finish processing.`);
  if (failed.length) warnings.push(`${failed.length} document${failed.length === 1 ? "" : "s"} failed processing and will not be analyzed.`);

  if (!String(form?.policy_limits || "").trim()) warnings.push("Policy limits are missing; exposure and authority analysis may be incomplete.");
  if (!String(form?.insured_name || "").trim()) warnings.push("Insured name is missing.");
  if (!String(form?.claimant_name || "").trim()) warnings.push("Claimant name is missing.");
  if (!String(form?.current_demand || "").trim()) warnings.push("Current demand is not provided; settlement analysis may be limited.");

  return { isValid: blocking.length === 0, blocking, warnings };
}
