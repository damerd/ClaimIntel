# ClaimIntel

**Smarter Claims Analysis. Better Decisions.**

ClaimIntel is an AI-powered claims intelligence platform designed to help insurance professionals organize claim information, identify missing evidence, and generate explainable claim-analysis reports while preserving human authority over decisions.

## Milestone Two Enhancement

This branch contains the CS 499 software design and engineering enhancement. The original Base44 export is preserved on the `main` branch, while this branch demonstrates a more maintainable application architecture through service extraction, advisory validation, standardized errors, canonical report modeling, and improved workflow states.

## Core Engineering Improvements

- Separated claim orchestration from React page components.
- Centralized AI prompts, response schemas, and claim-review configuration.
- Added structured document processing and file validation.
- Added advisory claim-readiness validation.
- Standardized application errors and recovery messages.
- Unified screen, clipboard, text, PDF, and Word reporting around one report model.
- Centralized saved-review loading, retry, archive, and deletion operations.
- Added a reusable founder identity component without confusing platform authorship with AI-generated report authorship.

## Technology

React 18, Vite, Base44 SDK, React Router, TanStack Query, Zod, Tailwind CSS, jsPDF, and docx export utilities.

## Local Setup

```bash
npm install
npm run dev
```

Create `.env.local` with the required Base44 values:

```env
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

## Validation

```bash
npm run lint
npm run build
```

## Documentation

- [Architecture](ARCHITECTURE.md)
- [Software Engineering Enhancements](SOFTWARE_ENGINEERING_ENHANCEMENTS.md)
- [Change Log](CHANGELOG.md)

## Founder

**Designed and engineered by Damien Dennis**  
**Founder & Lead Software Engineer**

*Built from claims experience. Engineered for better decisions.*


## Engineering Documentation

- [Architecture](ARCHITECTURE.md)
- [Software Engineering Enhancements](SOFTWARE_ENGINEERING_ENHANCEMENTS.md)
- [Engineering Decisions](docs/Engineering-Decisions.md)
- [System Workflow](docs/System-Workflow.md)
- [Changelog](CHANGELOG.md)
