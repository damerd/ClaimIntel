export const STOP_WORDS = new Set([
  "a", "an", "and", "corp", "corporation", "inc", "incorporated", "llc",
  "of", "or", "the", "v", "vs",
]);

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9$]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value, options = {}) {
  const { removeStopWords = true, minimumLength = 2 } = options;
  const normalized = normalizeText(value);
  if (!normalized) return [];

  return normalized
    .split(" ")
    .filter((token) => token.length >= minimumLength)
    .filter((token) => !removeStopWords || !STOP_WORDS.has(token));
}

export function uniqueTokens(value, options = {}) {
  return new Set(tokenize(value, options));
}

export function meaningfulTokenMatch(value, documentTokens) {
  const expected = uniqueTokens(value);
  if (expected.size === 0) {
    return { matched: 0, total: 0, ratio: 1, missing: [] };
  }

  let matched = 0;
  const missing = [];

  for (const token of expected) {
    if (documentTokens.has(token)) matched += 1;
    else missing.push(token);
  }

  return {
    matched,
    total: expected.size,
    ratio: matched / expected.size,
    missing,
  };
}

export function digitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function dateVariants(value) {
  if (!value) return [];
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return [normalizeText(value)].filter(Boolean);

  const [, year, month, day] = match;
  const monthNumber = String(Number(month));
  const dayNumber = String(Number(day));
  const monthNames = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];
  const monthName = monthNames[Number(month) - 1];

  return [
    `${year} ${month} ${day}`,
    `${month} ${day} ${year}`,
    `${monthNumber} ${dayNumber} ${year}`,
    `${monthName} ${dayNumber} ${year}`,
  ];
}
