# CS 499 Milestone Four — Database Enhancement Design

## Enhancement objective

The original ClaimIntel artifact stored claim metadata, source text, AI-generated report sections, readiness data, validation results, and comparative verdict data in one `ClaimReview` record. React pages also called Base44 entity methods directly. That design worked for a beta, but it tightly coupled the interface to persistence, made records increasingly large, and provided no recoverable deletion or version history.

The Milestone Four enhancement introduces related entities, controlled repositories, compatibility routing, version history, and recoverable deletion while retaining legacy fields long enough to support existing reports.

## Before

```text
React page
   └── direct base44.entities.ClaimReview calls
          └── one large ClaimReview record
```

Primary limitations:

- Generated analysis and claim metadata shared one record.
- Document metadata was not retained as related database records.
- Deletes were permanent from the application workflow.
- Updates had no version history.
- Search and filtering occurred primarily after loading records into the browser.
- Audit failures were silently discarded.
- Client code could send fields without a shared write whitelist.

## Enhanced design

```text
Existing React screens
   └── Base44 compatibility adapter
          └── repository/service layer
                 ├── ClaimReview
                 ├── ClaimDocument
                 ├── ClaimAnalysis
                 ├── ClaimReviewHistory
                 └── AuditLog
```

The compatibility adapter allows existing screens to keep using the familiar `base44.entities.ClaimReview` interface. Internally, it separates core claim updates from generated analysis, writes related records through repositories, and hydrates report reads with the latest analysis version. This migration strategy avoids a risky rewrite of the full analysis interface while still changing the actual persistence architecture.

### ClaimReview

Stores core claim metadata and lifecycle state. New fields support normalized claim-number matching, version numbers, activity timestamps, frequently queried analysis summaries, and recoverable deletion.

### ClaimDocument

Stores document metadata, processing status, extracted text, storage references, and content hashes. Each record is related through `claim_review_id`. The current migration writes the consolidated claim-file text as a related document record so document persistence is active even before every uploader field is migrated individually.

### ClaimAnalysis

Stores versioned AI results separately from core claim metadata. The complete report remains JSON-serialized because its shape varies by selected report sections, while frequently queried summary values remain separate fields.

When the existing analysis page updates a reviewed claim, the compatibility adapter extracts the generated report fields, converts serialized structured values back into objects, creates a new `ClaimAnalysis` version, updates query-friendly summary fields on `ClaimReview`, and returns a hydrated object to the existing interface.

### ClaimReviewHistory

Stores append-only snapshots of tracked fields for create, update, status, analysis, deletion, and restoration events. A visible Database History page displays versions, changed fields, timestamps, and actors.

### AuditLog

Records operational activity without including raw claim-file text, extracted medical information, follow-up conversations, or full AI payloads. Audit persistence is nonblocking, but failures now return a detectable result and emit a controlled warning.

## Data integrity controls

The repository layer provides:

- Required-field validation.
- Supported status and line-of-business validation.
- Readiness-score range validation.
- Claim-number normalization for duplicate detection.
- A writable-field whitelist.
- Separation of full report content from query-friendly summaries.
- Version increments on material updates.
- Recoverable soft deletion and restoration.
- Append-only history and sanitized audit creation.
- User-scoped access through Base44 row-level security.
- Server-side search and filtering using entity query operators.
- Backward compatibility for legacy records without `record_status`.

## User-visible database features

The Saved Reviews page now includes:

- Repository-backed search and filtering.
- Version numbers on report records.
- Soft deletion rather than permanent deletion.
- A recycle bin for deleted records.
- Restoration of deleted records.
- Direct access to a database-history timeline.

These controls make the enhancement observable to an instructor instead of limiting it to backend code.

## Storage trade-off

Fully normalizing every generated report section would create many entities with unstable schemas and excessive joins. Keeping the variable analysis body as JSON inside `ClaimAnalysis` preserves flexibility. Separating that payload from `ClaimReview`, while storing summary values such as readiness score and venue risk as dedicated fields, provides a practical balance between query performance and schema flexibility.

## Migration approach

1. Retain legacy report fields in the `ClaimReview` schema so existing records remain readable.
2. Route existing `ClaimReview` calls through a compatibility adapter.
3. Write new generated reports to versioned `ClaimAnalysis` records.
4. Write consolidated source text to related `ClaimDocument` records.
5. Hydrate report reads by combining the core review with its latest analysis.
6. Preserve existing application screens while new repository-backed screens expose history, deletion, and restoration.
7. Remove legacy analysis fields only after historical records and remaining screens are fully migrated.

## Test and build evidence

Run locally:

```bash
npm run test:database
npm run build
```

The database test script contains 13 assertions covering:

- Claim-number normalization.
- Required-field validation.
- Invalid-status rejection.
- Readiness-score range validation.
- Writable-field enforcement.
- Removal of sensitive audit metadata.
- Accurate changed-field detection for history records.
- Recognition of generated analysis updates.
- Separation of lifecycle-only updates from analysis versions.
- Structured JSON restoration before analysis persistence.
- Mirroring only query-friendly analysis summaries.
- Transformation of claim text into a related document record.

A GitHub Actions workflow runs the database tests and full production build on the enhancement branch and pull request.

## Course outcomes supported

- **Outcome 3:** Database and query design choices manage trade-offs between normalization, flexible JSON storage, versioning, and retrieval performance.
- **Outcome 4:** The repository layer, compatibility adapter, related entities, and user-visible lifecycle controls implement an industry-specific claims solution using professional computing practices.
- **Outcome 5:** Row-level security, audit minimization, controlled updates, version history, and recoverable deletion demonstrate a security mindset.
- **Outcome 2:** The architecture documentation, automated test evidence, and visible history interface communicate the enhancement to technical and nontechnical reviewers.
