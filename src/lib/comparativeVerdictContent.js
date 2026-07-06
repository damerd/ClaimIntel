// Helpers for parsing and serializing Comparative Verdict Intelligence data

export function getComparativeVerdictData(review) {
  if (!review || !review.comparative_verdict_data) return null;
  try {
    const data = typeof review.comparative_verdict_data === "string"
      ? JSON.parse(review.comparative_verdict_data)
      : review.comparative_verdict_data;
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

export function hasComparativeVerdictData(review) {
  return getComparativeVerdictData(review) !== null;
}

// Serialize to plain text for text/PDF exports
export function serializeComparativeVerdictText(data) {
  if (!data) return "";
  let out = "";

  // 1. Exposure Snapshot
  const snap = data.exposure_snapshot;
  if (snap) {
    out += "EXPOSURE SNAPSHOT\n";
    out += `  Expected Verdict Range: ${snap.expected_verdict_range || "Not available"}\n`;
    out += `  Expected Settlement Range: ${snap.expected_settlement_range || "Not available"}\n`;
    out += `  Median Comparable Verdict: ${snap.median_comparable_verdict || "Not available"}\n`;
    out += `  Median Comparable Settlement: ${snap.median_comparable_settlement || "Not available"}\n`;
    out += `  Comparable Cases Found: ${snap.comparable_cases_found ?? "Not available"}\n`;
    out += `  Comparison Quality: ${snap.comparison_quality || "Not available"}\n\n`;
  }

  // 2. Why These Comparables Matter
  if (data.why_comparables_matter) {
    out += "WHY THESE COMPARABLES MATTER\n";
    out += `  ${data.why_comparables_matter}\n\n`;
  }

  // 3. Similarity Breakdown
  const sims = data.similarity_breakdown;
  if (Array.isArray(sims) && sims.length > 0) {
    out += "SIMILARITY BREAKDOWN\n";
    sims.forEach((s) => {
      out += `  ${s.category || "N/A"}: ${s.level || "N/A"}\n`;
      if (s.explanation) out += `    Why this matters: ${s.explanation}\n`;
    });
    out += "\n";
  }

  // 4. Top Comparable Cases
  const cases = data.top_comparable_cases;
  if (Array.isArray(cases) && cases.length > 0) {
    out += "TOP COMPARABLE CASES\n";
    cases.forEach((c, i) => {
      out += `  Case ${i + 1}:\n`;
      out += `    Jurisdiction: ${c.jurisdiction || "N/A"}\n`;
      out += `    Case Type: ${c.case_type || "N/A"}\n`;
      out += `    Similarity Score: ${c.similarity_score ?? "N/A"}%\n`;
      out += `    Verdict/Settlement: ${c.verdict_or_settlement || "N/A"}\n`;
      out += `    Key Injuries: ${c.key_injuries || "N/A"}\n`;
      out += `    Treatment: ${c.treatment || "N/A"}\n`;
      out += `    Liability Facts: ${c.liability_facts || "N/A"}\n`;
      out += `    Key Similarities: ${c.key_similarities || "N/A"}\n`;
      out += `    Key Differences: ${c.key_differences || "N/A"}\n`;
      out += `    Why This Case Matters: ${c.why_this_case_matters || "N/A"}\n`;
    });
    out += "\n";
  }

  // 5. Valuation Drivers
  const drivers = data.valuation_drivers;
  if (drivers) {
    if (Array.isArray(drivers.upward) && drivers.upward.length > 0) {
      out += "UPWARD EXPOSURE DRIVERS\n";
      drivers.upward.forEach((d) => {
        out += `  ${d.factor || "N/A"} [${d.rating || "N/A"}]: ${d.explanation || ""}\n`;
      });
      out += "\n";
    }
    if (Array.isArray(drivers.downward) && drivers.downward.length > 0) {
      out += "DOWNWARD EXPOSURE DRIVERS\n";
      drivers.downward.forEach((d) => {
        out += `  ${d.factor || "N/A"} [${d.rating || "N/A"}]: ${d.explanation || ""}\n`;
      });
      out += "\n";
    }
  }

  // 6. Recommended Considerations
  const considerations = data.recommended_considerations;
  if (Array.isArray(considerations) && considerations.length > 0) {
    out += "RECOMMENDED CONSIDERATIONS\n";
    considerations.forEach((c) => {
      out += `  [ ] ${c.item || "N/A"}\n`;
      if (c.language) out += `      ${c.language}\n`;
    });
    out += "\n";
  }

  // 7. Comparison Quality
  const quality = data.comparison_quality_assessment;
  if (quality) {
    out += "COMPARISON QUALITY\n";
    out += `  Rating: ${quality.rating || "N/A"}\n`;
    if (quality.supporting_reasons) out += `  Supporting Reasons: ${quality.supporting_reasons}\n`;
    if (quality.missing_information) out += `  Missing Information: ${quality.missing_information}\n`;
    if (quality.warnings) out += `  Warnings: ${quality.warnings}\n`;
    out += "\n";
  }

  // 8. Defense / Plaintiff Perspectives
  if (data.defense_perspective) {
    out += "DEFENSE PERSPECTIVE\n";
    out += `  ${data.defense_perspective}\n\n`;
  }
  if (data.plaintiff_perspective) {
    out += "PLAINTIFF PERSPECTIVE\n";
    out += `  ${data.plaintiff_perspective}\n\n`;
  }

  return out.trim();
}