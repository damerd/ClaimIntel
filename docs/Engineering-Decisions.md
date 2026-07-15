# Engineering Decisions

This document records the architectural reasoning behind ClaimIntel's software-engineering enhancement. The decisions focus on maintainability, separation of concerns, reliability, and professional software design.

## Decision 001 — Separate Claim Review Responsibilities

**Status:** Accepted  
**Milestone:** CS 499 Milestone Two — Software Design and Engineering

### Context

The original `NewClaimReview.jsx` page combined several unrelated responsibilities in one component:

- page rendering and form state;
- document upload and text extraction;
- validation rules;
- AI prompt construction and response schema definition;
- Base44 record creation and updates;
- audit logging;
- error interpretation and user messaging.

This design made the page difficult to read, test, maintain, and extend. A change to document processing or report generation could unintentionally affect the interface because the responsibilities were tightly coupled.

### Decision

Separate the claim-review workflow into purpose-specific modules:

- `claimReviewConfig.js` owns prompts, schemas, workflow states, and supported business-line configuration;
- `claimReviewService.js` owns claim creation, analysis orchestration, persistence, status transitions, and audit events;
- `documentProcessingService.js` owns upload validation, OCR and text extraction behavior, and file-processing failures;
- `claimValidation.js` owns required-field checks and advisory warnings;
- `appError.js` normalizes technical failures into consistent, safe, user-facing messages;
- `NewClaimReview.jsx` remains responsible primarily for presentation, user interaction, and invoking the workflow.

### Rationale

The service and configuration boundaries create clearer ownership of behavior. They reduce the size and complexity of the page component and make the workflow easier to modify without rewriting unrelated code. The design also supports future automated testing because business behavior can be exercised independently of the React interface.

### Consequences

**Benefits**

- Improved separation of concerns
- Smaller and more readable page components
- Reusable workflow and validation logic
- More consistent error handling
- Lower risk of interface changes breaking persistence or analysis behavior
- Better foundation for future testing and feature expansion

**Trade-offs**

- More files must be understood by new contributors
- Service boundaries require consistent naming and documentation
- Some Base44 platform dependencies remain inside the service layer

### Outcome

The main claim-review page was reduced from approximately 483 lines to roughly half that size, while the extracted responsibilities became explicit modules. This is a structural enhancement rather than a cosmetic rewrite and directly demonstrates software design and engineering competency.
