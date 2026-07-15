# ClaimIntel Architecture

## Design Goal

The Milestone Two architecture separates presentation concerns from application workflows so that claim processing, validation, reporting, and persistence can evolve without forcing page components to absorb every responsibility.

## Application Layers

### Presentation

React pages and reusable components render forms, readiness warnings, report sections, saved-review states, and user actions. Presentation code consumes services rather than directly coordinating every backend operation.

### Configuration

`src/config/claimReviewConfig.js` contains lines of business, jurisdictions, report-section instructions, and the structured AI response schema. This prevents prompt and schema definitions from being embedded inside page components.

### Services

- `claimReviewService.js` coordinates claim creation, AI analysis, persistence, status changes, and auditing.
- `documentProcessingService.js` validates files and coordinates upload, OCR, and text extraction.
- `savedReviewService.js` centralizes saved-review loading, retry, archive, and deletion behavior.

### Domain Utilities

- `claimValidation.js` produces blocking issues and advisory warnings.
- `appError.js` converts technical failures into stable error codes and safe recovery messages.
- `reportContent.js` builds the canonical report model and text representation.
- `reportExport.js` adapts the canonical model into PDF and Word output.

## Primary Workflow

1. The user enters claim information and uploads documents.
2. Advisory validation identifies required corrections and quality warnings.
3. The document service validates and extracts readable content.
4. The claim-review service creates the review and invokes structured analysis.
5. The service persists results, updates status, and writes an audit event.
6. The results page loads the review and builds one canonical report model.
7. Screen rendering and exports consume that shared model.

## Architectural Trade-Offs

The enhancement retains the Base44 backend integration rather than replacing the platform during a category-specific milestone. Generated UI primitives are also preserved unless a defect directly affects the enhanced workflow. This limits unnecessary regression risk while demonstrating clear improvement in maintainability and separation of concerns.
