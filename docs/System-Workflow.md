# ClaimIntel System Workflow

```text
User Input
   ↓
Advisory Validation
   ↓
Document Upload and Extraction
   ↓
Claim Review Service
   ↓
AI Analysis and Structured Response
   ↓
Persistence and Audit Logging
   ↓
Canonical Report Model
   ↓
Screen, Clipboard, PDF, Word, and Text Outputs
```

The workflow keeps interface concerns separate from processing and persistence. Validation identifies missing or weak information before analysis, but advisory warnings do not automatically prevent a review from continuing. All report output formats use one report model to reduce inconsistencies between the application and exported documents.
