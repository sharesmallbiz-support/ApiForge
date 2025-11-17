# Implementation Plan: Baseline Quality Audit Process

**Branch**: `001-establish-quality-audit` | **Date**: 2025-11-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-establish-quality-audit/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Deliver a one-command quality audit that orchestrates linting, type-checking, production build, targeted smoke tests, dependency health scans, and security advisories. Surface the combined results through both console output and a machine-readable report published in CI, and document a runbook that enables new contributors to execute and interpret the audit inside 30 minutes. The audit must auto-install dependencies when `node_modules` is missing, integrate cleanly with the existing Vite/Express monorepo, and uphold the ApiForge constitution mandates around offline readiness, importer safety, onboarding simplicity, and evergreen dependencies.

## Technical Context

**Language/Version**: Node.js 20 LTS runtime with TypeScript 5.x build targets (React 18 client + Express bridge)  
**Primary Dependencies**: React, TanStack Query, shadcn/ui, Express, Drizzle ORM; audit stack adds ESLint + @typescript-eslint suite, Vitest smoke runner, optional Playwright hooks for future work  
**Storage**: Browser localStorage via `client/src/lib/local-storage-service.ts` for product data; CI artifacts stored in GitHub Actions  
**Testing**: `tsc --noEmit` currently available; the plan introduces Vitest smoke tests executed through the audit command while leaving Playwright optional for E2E follow-up  
**Target Platform**: Cross-platform Node CLI (macOS, Windows, Linux) plus GitHub Actions hosted runners  
**Project Type**: React + Express monorepo (client/server/shared)  
**Performance Goals**: Keep audit runtime <8 minutes on GitHub Standard runners with CI instrumentation that records duration and fails when thresholds are exceeded; incremental local runs <3 minutes  
**Constraints**: Offline-friendly developer workflow; audit must auto-detect missing dependencies, retry registry calls before flagging security checks as skipped, and avoid mutating project state beyond reports  
**Scale/Scope**: Quality gate for all ApiForge pull requests and release branches

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] **Local-First Persistence**: Ensure audit command optionally runs an offline sample (leveraging existing local storage sample data) and document that the script reads but never mutates persisted workspace files; include Airplane Mode guidance in quickstart.
- [ ] **Import Interoperability**: Validate that executing the audit leaves OpenAPI/import flows untouched by running the bundled sample import during QA and capturing results in the report appendix.
- [ ] **Onboarding Simplicity**: Update the quickstart/README so new contributors can run `npm run quality:audit` within two guided steps and interpret failures via a cheatsheet appended to the quickstart.
- [ ] **Quality & Audit Discipline**: Lock required sub-commands (ESLint, `tsc --noEmit`, `vite build`, Vitest smoke suite, `npm outdated`, `npm audit`), publish the JSON schema (`contracts/quality-audit-report.schema.json`), wire GitHub Actions to block merges on failed exits, and document runtime instrumentation thresholds for SC-002.
- [ ] **Evergreen Dependencies**: Integrate outdated-package detection into the report, describe the follow-up workflow (issue templates or backlog tags), and ensure the CLI exposes remediation hints.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
ApiForge/
├── package.json
├── client/
│   └── src/                # React UI, request builder, local-first persistence helpers
├── server/
│   └── *.ts                # Express API proxy, storage adapters, execution pipeline
├── shared/
│   └── schema.ts           # Zod models shared across client/server/local storage
├── scripts/                # (to add) Node/TypeScript automation entrypoints (quality audit runner)
├── .github/
│   ├── prompts/
│   ├── agents/
│   └── workflows/          # (to add) quality-audit.yml publishing reports & gating PRs
├── specs/
│   └── 001-establish-quality-audit/
│       ├── spec.md
│       └── plan.md
├── drizzle/                # SQL migrations
└── dist/                   # Build outputs (ignored in Git)
```

**Structure Decision**: Maintain the existing client/server/shared layout. Introduce a top-level `scripts/` directory for reusable Node automation (quality audit driver) and extend `.github/workflows/` with a dedicated CI workflow that calls the same script. No additional project hierarchy changes are required; new configuration lives alongside current tooling (`package.json`, `tsconfig.json`).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
