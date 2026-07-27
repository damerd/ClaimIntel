function confidenceFromScore(score) {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

export function buildReadinessRecommendation(validationResult) {
  const recommendations = [...new Set(
    validationResult.issues
      .map((issue) => issue.recommendation)
      .filter(Boolean),
  )].slice(0, 3);

  if (recommendations.length === 0) {
    return "No deterministic validation conflicts were identified. Continue normal claim review and verify source documents before making a final decision.";
  }

  return recommendations.join(" ");
}

export function buildPersistedValidationData(validationResult) {
  const recommendedActions = [...new Set(
    validationResult.issues
      .map((issue) => issue.recommendation)
      .filter(Boolean),
  )];

  return {
    algorithm_version: "2.0.0-deterministic",
    overall_validation_status: validationResult.overallStatus,
    validation_score: validationResult.readinessScore,
    conflicts: validationResult.conflicts.map((issue) => ({
      issue: issue.explanation,
      category: issue.category,
      source_detail: issue.sources.length > 0
        ? issue.sources.join(", ")
        : "Entered form data compared with indexed claim text",
      impact: issue.severity === "Critical" || issue.severity === "High"
        ? "May materially affect the reliability of downstream claim analysis."
        : "Requires review before the information is treated as confirmed.",
      priority: issue.severity,
      recommended_follow_up: issue.recommendation,
    })),
    missing_evidence: validationResult.missingRequirements.map((issue) => ({
      item: issue.explanation,
      category: issue.category,
      why_it_matters: issue.recommendation,
      priority: issue.severity,
    })),
    confidence_factors: validationResult.categoryResults.map((result) => ({
      area: result.category,
      confidence: confidenceFromScore(result.score),
      explanation: `${result.category} received a deterministic readiness score of ${result.score}/100 and is classified as ${result.status}.`,
    })),
    priority_flags: validationResult.issues.map((issue) => ({
      flag: issue.explanation,
      severity: issue.severity,
      explanation: issue.recommendation,
    })),
    recommended_validation_actions: recommendedActions,
    validation_summary: `The deterministic validation engine indexed ${validationResult.statistics.uniqueTokenCount} unique tokens across ${validationResult.statistics.sourceCount} source records, identified ${validationResult.statistics.issueCount} issue(s), and calculated a readiness score of ${validationResult.readinessScore}/100.`,
    algorithm_statistics: validationResult.statistics,
  };
}

export function buildValidationPromptContext(validationResult) {
  return JSON.stringify({
    overall_status: validationResult.overallStatus,
    readiness_score: validationResult.readinessScore,
    blocking_issues: validationResult.blockingIssues.map((issue) => ({
      category: issue.category,
      field: issue.field,
      severity: issue.severity,
      explanation: issue.explanation,
    })),
    missing_requirements: validationResult.missingRequirements.map((issue) => issue.explanation),
  }, null, 2);
}
