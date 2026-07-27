import { normalizeText, tokenize } from "./textNormalizer.js";

/**
 * Build an inverted index that maps each token to the documents containing it.
 * Index construction is O(T), where T is the total number of processed tokens.
 */
export function buildDocumentIndex({ claimText = "", documents = [] } = {}) {
  const sources = [];
  const processedDocuments = documents.filter(
    (document) => document?.status === "processed" && document.extractedText,
  );

  processedDocuments.forEach((document, index) => {
    sources.push({
      id: document.id || `document-${index + 1}`,
      name: document.name || `Document ${index + 1}`,
      documentType: document.documentType || document.mimeType || "Unknown",
      text: String(document.extractedText),
    });
  });

  if (String(claimText).trim()) {
    sources.push({
      id: "combined-claim-text",
      name: "Combined Claim Text",
      documentType: "Combined text",
      text: String(claimText),
    });
  }

  const tokenSources = new Map();
  const normalizedSourceText = new Map();
  const allTokens = new Set();

  for (const source of sources) {
    const normalized = normalizeText(source.text);
    normalizedSourceText.set(source.id, normalized);

    for (const token of tokenize(normalized, { removeStopWords: false })) {
      allTokens.add(token);
      if (!tokenSources.has(token)) tokenSources.set(token, new Set());
      tokenSources.get(token).add(source.id);
    }
  }

  return {
    sources,
    tokenSources,
    normalizedSourceText,
    allTokens,
    combinedNormalizedText: [...normalizedSourceText.values()].join(" "),
    sourceCount: sources.length,
    uniqueTokenCount: tokenSources.size,
  };
}

export function sourcesForTokens(index, tokens) {
  const sourceIds = new Set();
  for (const token of tokens) {
    const matches = index.tokenSources.get(token);
    if (!matches) continue;
    for (const sourceId of matches) sourceIds.add(sourceId);
  }

  const sourceById = new Map(index.sources.map((source) => [source.id, source]));
  return [...sourceIds]
    .map((sourceId) => sourceById.get(sourceId))
    .filter(Boolean);
}
