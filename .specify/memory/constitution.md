<!--
Sync Impact Report
Version: N/A → 1.0.0
Modified Principles: (new) I. Local-First Persistence, (new) II. Import Interoperability, (new) III. Onboarding Simplicity, (new) IV. Quality & Audit Discipline, (new) V. Evergreen Dependencies
Added Sections: Implementation Constraints, Development Workflow & Quality Gates
Removed Sections: None
Templates requiring updates: .specify/templates/plan-template.md ✅, .specify/templates/spec-template.md ✅, .specify/templates/tasks-template.md ✅
Follow-up TODOs: None
-->

# ApiForge Constitution

## Core Principles

### I. Local-First Persistence (NON-NEGOTIABLE)
All product work MUST operate fully against the browser-first storage pipeline: data is owned by `client/src/lib/local-storage-service.ts`, mirrored through shared Zod schemas, and runnable offline. Any server-side helper MUST be optional, with fallbacks bundled so workflows remain functional when the Express bridge is unreachable. Every feature proposal and review MUST include an offline verification plan and regression test (unit or integration) that exercises the local-storage adapter layer.

### II. Import Interoperability
The platform MUST ingest external assets (Postman collections, OpenAPI specs, curl snippets) without data loss. Enhancements that touch requests, folders, or environments MUST extend the shared schema, storage implementations (memory, local storage, SQLite), and import/export paths in the same change. Backward compatibility for previously imported assets MUST be validated through fixtures or automated tests before merge.

### III. Onboarding Simplicity
ApiForge MUST remain approachable for first-run users: zero required configuration, guided sample data, and descriptive UI copy. Any change that introduces new setup, concepts, or navigation MUST include documentation updates (README, in-app guides) and provide sensible defaults that keep the quick-start flow under two clicks. Accessibility and clarity reviews are required in PR descriptions for any UI change.

### IV. Quality & Audit Discipline
Code entering the main branch MUST pass automated formatting, linting, and type safety (`npm run check`) alongside scenario tests that cover new or affected capabilities. Releases MUST include dependency vulnerability scans (`npm audit` or equivalent) and measurable acceptance evidence (screenshots, recordings, or test logs). Debug instrumentation (e.g., `DebugPanel`) MUST be updated when expanding execution logging.

### V. Evergreen Dependencies
Dependencies MUST track current stable releases. When a dependency update lands, authors MUST confirm changelog review, run the full quality suite, and document breaking change mitigations in the PR. The app MUST stay compatible with the latest supported Node LTS, Vite, and React minor releases; work to upgrade MUST be prioritized in each iteration plan.

## Implementation Constraints

- React 18 + TypeScript with Vite is the canonical client stack; UI components are sourced from the local shadcn copies in `client/src/components/ui` and MUST remain theme-compatible.
- Data models live in `shared/schema.ts`; all persistence layers (local storage, in-memory, SQLite) MUST stay schema-aligned in the same change set.
- Execution runs through Express (`server/index.ts`) strictly for HTTP calls and OpenAPI import; no business logic or stateful persistence may bypass the local-first pipeline.
- TanStack Query drives data access; query keys MUST adhere to the joined-path convention (`['/api/requests', id]`) to keep cache coherency.
- Build and tooling commands are confined to the npm scripts defined in `package.json`; cross-tooling changes require governance review.

## Development Workflow & Quality Gates

- Begin with `/speckit.plan` to capture research, then derive `/speckit.spec` and `/speckit.tasks`; each artifact MUST reference the principle checks relevant to the work.
- Every plan MUST include an explicit Constitution Check covering offline guarantees, importer compatibility, onboarding impact, quality verifications, and dependency posture.
- Feature branches MUST demonstrate offline behavior (video, gifs, or automated test output) before seeking review.
- Code reviews MUST confirm shared schema updates propagate to storage adapters, UI, and importers, and that documentation and onboarding assets remain accurate.
- Releases MUST bundle updated quickstart guidance and dependency audit evidence inside the release notes.

## Governance

This constitution supersedes prior process documents. Amendments require: (1) a written rationale in a `/specs` proposal referencing affected principles, (2) approval from two maintainers not authoring the change, and (3) simultaneous updates to impacted templates and docs. Versioning follows semantic rules: MAJOR for breaking or removed principles, MINOR for new principles/sections, PATCH for clarifications. The constitution MUST be re-validated during quarterly quality reviews alongside dependency currency checks.

**Version**: 1.0.0 | **Ratified**: 2025-11-16 | **Last Amended**: 2025-11-16
