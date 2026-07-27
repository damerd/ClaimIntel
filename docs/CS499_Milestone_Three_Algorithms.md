# CS 499 Milestone Three: Algorithms and Data Structures

## Artifact

**ClaimIntel** is an AI-assisted insurance claims intelligence application created in 2026. It accepts structured claim information and extracted document text, then generates a professional claim review addressing areas such as liability, coverage, damages, venue, exposure, missing information, and recommended next steps.

- Original artifact reference: `main` at commit `fd80c66b88b7f8103aea42f306fd8bec9455770a`
- Enhanced artifact branch: `milestone3-algorithms`

## Enhancement Summary

Before this milestone, `NewClaimReview.jsx` used a small inline function that converted the claim text to lowercase and relied mainly on `String.includes()` to check a few fields. The language model was also asked to generate the readiness score and validation results. That approach had four weaknesses:

1. Validation logic was embedded in the React page.
2. Direct substring checks were difficult to extend and produced weak matches.
3. Conflicts were not deduplicated, scored, or ranked.
4. Readiness and validation results were nondeterministic because the language model generated them.

The enhancement adds a deterministic validation and prioritization pipeline that runs before the AI report is generated. The engine now:

1. Normalizes and tokenizes claim text.
2. Builds an inverted document index.
3. Compares structured claim fields with indexed evidence.
4. Detects unsupported values and missing evidence.
5. Deduplicates issues by stable identifiers.
6. Assigns numeric priorities by severity.
7. Ranks issues with a binary-heap priority queue.
8. Calculates weighted category and overall readiness scores.
9. Displays a pre-analysis validation preview.
10. Persists the deterministic results as the authoritative readiness and validation data.

The language model still generates narrative claim analysis, but it no longer controls the deterministic readiness score.

## Files Added or Enhanced

### Algorithm implementation

- `src/algorithms/PriorityQueue.js`
- `src/algorithms/textNormalizer.js`
- `src/algorithms/documentIndex.js`
- `src/algorithms/claimValidationEngine.js`

### Integration and configuration

- `src/lib/claimAnalysisConfig.js`
- `src/lib/deterministicValidationAdapter.js`
- `src/pages/NewClaimReview.jsx`

### Tests

- `src/algorithms/__tests__/algorithms.test.js`
- `package.json` includes the `test:algorithms` command.

## Data Structures

### Set

`Set` is used for stop words, unique document tokens, document-source identifiers, issue recommendations, and duplicate prevention. Average membership checks are constant time, which is more appropriate than repeatedly scanning arrays.

### Map

`Map` is used for:

- Tokens mapped to the source documents containing them
- Normalized text mapped to source identifiers
- Lines of business mapped to synonym lists
- Readiness categories mapped to weights and scores
- Issue identifiers mapped to unique issue objects

The document index is an inverted index. Instead of repeatedly searching every document for every token, the application can directly locate the documents associated with a token.

### Binary-Heap Priority Queue

The stable max-priority queue ranks critical and high-severity issues ahead of medium and low-severity issues. Insertion and removal are approximately `O(log I)`, where `I` is the number of issues. Issues with equal priorities retain insertion order, making results deterministic.

### Structured Objects and Arrays

Validation issues use a consistent structure containing the issue identifier, category, field, severity, numeric priority, explanation, recommendation, and source names. This structure supports UI display, persistence, testing, and future reporting.

## Algorithm Pipeline

```text
Claim form and extracted document text
                |
                v
        Normalize and tokenize
                |
                v
  Build inverted index with Map and Set
                |
                v
       Apply deterministic rules
                |
                v
 Deduplicate issues with an identifier Map
                |
                v
 Rank issues with a binary-heap queue
                |
                v
 Calculate weighted category scores
                |
                v
 Display and persist validation results
                |
                v
 Generate AI-supported narrative report
```

## Complexity Analysis

Let:

- `T` represent the total number of processed text tokens.
- `F` represent the number of validated form fields.
- `R` represent the number of fixed validation rules.
- `I` represent the number of detected issues.

Approximate complexity:

- Text normalization and index construction: `O(T)`
- Rule evaluation: `O(F + R)` after indexing
- Priority-queue insertion and ordered extraction: `O(I log I)`
- Inverted-index storage: `O(T)` in the worst case

The main trade-off is additional memory for the index in exchange for avoiding repeated full-document scans and producing reusable source mappings.

## Deterministic Readiness Scoring

The overall score is a weighted calculation across these categories:

| Category | Weight |
|---|---:|
| Claim Identity | 15% |
| Coverage | 25% |
| Liability | 20% |
| Medical Documentation | 15% |
| Damages Documentation | 15% |
| Litigation and Venue | 10% |

The engine calculates evidence-based category scores, applies deductions for ranked issues, clamps every score between 0 and 100, and calculates the weighted result. The same input produces the same result.

## Validation Safeguards

- Missing form fields are not automatically treated as missing when supporting evidence appears in the indexed documents.
- Negative language such as “no demand has been received” does not satisfy the requirement for an actual demand.
- Monetary values are matched against numeric candidates found in individual source documents rather than against one concatenated digit string.
- Common legal suffixes and stop words are excluded from meaningful name matching.
- Line-of-business synonyms are supported.
- Issues are deduplicated before ranking.
- Extremely short claim text produces an `Insufficient Information` result instead of false certainty.
- React escapes validation content before display, and uploaded text is never dynamically executed.

## Automated Tests

Run:

```bash
npm run test:algorithms
```

The test suite currently contains 14 tests covering:

- Priority ordering
- Stable ordering for equal priorities
- Inverted-index source mapping
- Stop-word and legal-suffix handling
- Matching claim identity data
- Jurisdiction mismatch detection
- Line-of-business synonyms
- Duplicate issue prevention
- Severity ordering
- Readiness-score reduction when evidence is missing
- Document-backed evidence preventing false warnings
- Negative demand language
- Score boundaries
- Insufficient-information handling

All 14 tests passed during enhancement verification.

## Manual Verification

1. Check out `milestone3-algorithms`.
2. Run `npm install`.
3. Run `npm run test:algorithms`.
4. Run `npm run dev`.
5. Open the New Claim Review page.
6. Load the sample claim.
7. Select report sections and choose **Validate and Generate Report**.
8. Review the deterministic readiness score, indexed-term count, source count, and ranked issues.
9. Change the jurisdiction to a state not present in the claim file and run validation again.
10. Confirm that a high-priority jurisdiction conflict appears before report generation.

## Result

The enhancement changes ClaimIntel from an application that asked an AI model to estimate readiness into an application that applies repeatable algorithmic rules, purpose-selected data structures, explicit trade-offs, and automated tests before using AI for narrative decision support.
