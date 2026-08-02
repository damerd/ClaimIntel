# CS 499 Milestone Four — Database Enhancement Design

## Enhancement objective

The original ClaimIntel artifact stored claim metadata, source text, AI-generated report sections, readiness data, validation results, and comparative verdict data in one `ClaimReview` record. React pages also called Base44 entity methods directly. That design worked for a beta, but it tightly coupled the interface to persistence, made records increasingly large, and provided no recoverable deletion or version history.

The Milestone Four enhancement introduces related entities and a repository layer while retaining legacy report fields long enough to support existing records.

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
React page
   └── repository/service layer
          ├── ClaimReview
          ├── ClaimDocument
          ├── ClaimAnalysis
          ├── ClaimReviewHistory
          └── AuditLog
```

### ClaimReview

Stores core claim metadata and lifecycle state. New fields support normalized claim-number matching, version numbers, activity timestamps, and recoverable deletion.

### ClaimDocument

Stores document metadata, processing status, extracted text, storage references, and content hashes. Each record is related through `claim_review_id`.

### ClaimAnalysis

Stores versioned AI results separately from core claim metadata. The complete report remains JSON-serialized because its shape varies by selected report sections, while frequently queried summary values remain separate fields.

### ClaimReviewHistory

Stores append-only snapshots of tracked fields for create, update, status, analysis, deletion, and restoration events.

### AuditLog

Records operational activity without including raw claim-file text, extracted medical information, or full AI payloads. Audit persistence is nonblocking, but failures now return a detectable result and emit a controlled warning.

## Data integrity controls

The repository layer provides:

- Required-field validation.
- Supported status and line-of-business validation.
- Claim-number normalization for duplicate detection.
- A writable-field whitelist.
- Version increments on material updates.
- Recoverable soft deletion.
- History and audit creation.
- User-scoped access through Base44 row-level security.
- Server-side search and filtering using entity query operators.
- Backward compatibility for legacy records without `record_status`.

## Storage trade-off

Fully normalizing every generated report section would create many entities with unstable schemas and excessive joins. Keeping the variable analysis body as JSON inside `ClaimAnalysis` preserves flexibility. Separating that payload from `ClaimReview`, while storing summary values such as readiness score and venue risk as dedicated fields, provides a practical balance between query performance and schema flexibility.

## Migration approach

1. Keep legacy report fields in `ClaimReview` so existing records remain readable.
2. Write new analyses to `ClaimAnalysis` after the creation workflow is migrated.
3. Hydrate report views by combining the core review with its latest analysis.
4. Migrate historical records later if needed.
5. Remove legacy analysis fields only after all production records and views use the related entity.

## Test evidence

Run:

```bash
npm run test:database
```

The test script verifies:

- Claim-number normalization.
- Required-field validation.
- Invalid-status rejection.
- Writable-field enforcement.
- Removal of sensitive audit metadata.
- Accurate changed-field detection for history records.

## Course outcomes supported

- **Outcome 3:** Database and query design choices manage trade-offs between normalization, flexible JSON storage, and retrieval performance.
- **Outcome 4:** The repository layer and related entities implement an industry-specific claims solution using professional computing practices.
- **Outcome 5:** Row-level security, audit minimization, controlled updates, version history, and recoverable deletion demonstrate a security mindset.
- **Outcome 2:** The architecture documentation and test evidence communicate the enhancement to technical and nontechnical reviewers.
