---

description: "Task list for implementing the Baseline Quality Audit Process"
---

# Tasks: Baseline Quality Audit Process

**Input**: Design documents from `/specs/001-establish-quality-audit/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Focus Vitest coverage on the audit runner utilities and report writer; add Playwright coverage only if future phases extend to UI enforcement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare repository scaffolding and directories required by the audit artifacts.

- [ ] T001 Add `artifacts/.gitkeep` and ignore generated reports in `.gitignore`
- [ ] T002 Add Node.js 20 engine requirement and npm metadata in `package.json`
- [ ] T003 [P] Create `scripts/README.md` documenting automation conventions and directory purpose

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish linting, testing, and type definitions needed by all user stories before implementing the audit workflow.

- [ ] T004 Update `package.json` to add ESLint/Vitest dependencies and scripts (`lint`, `lint:fix`, `test`, `test:ci`)
- [ ] T005 [P] Create `.eslintrc.cjs` with TypeScript, React, hooks, and a11y rule configuration
- [ ] T006 [P] Create `.eslintignore` to exclude build artifacts (`dist/`, `artifacts/`, `node_modules/`)
- [ ] T007 [P] Add `vitest.config.ts` configured for client and server packages
- [ ] T008 Update `tsconfig.json` to include Vitest globals and test file patterns
- [ ] T009 Extend `shared/schema.ts` with Zod schemas and types for `QualityAuditChecklist`, `QualityAuditRun`, and `DependencyAdvisory`
- [ ] T010 [P] Scaffold `tests/quality-audit/.gitkeep` to hold Vitest suites for the audit runner

**Checkpoint**: Foundation ready – lint/test infrastructure exists and shared types unblock user story development.

---

## Phase 3: User Story 1 - One-Command Quality Audit (Priority: P1) 🎯 MVP

**Goal**: Deliver a single CLI command that runs lint, type-check, build, Vitest smoke tests, dependency, and security scans sequentially with optional offline validation.

**Independent Test**: From a clean working tree, run `npm run quality:audit -- --offline-sample`; verify each required step executes, the command exits non-zero on failure, and offline validation succeeds without mutating local storage files.

### Implementation for User Story 1

- [ ] T011 [P] [US1] Add Vitest checklist smoke test in `tests/quality-audit/checklist.spec.ts` covering step ordering and required flags
- [ ] T012 [US1] Implement baseline checklist metadata in `scripts/quality-audit/checklist.ts`
- [ ] T013 [P] [US1] Implement auto-install helper in `scripts/quality-audit/auto-install.ts` (detect missing deps, respect `APIFORGE_SKIP_AUTO_INSTALL`)
- [ ] T014 [US1] Implement sequential runner in `scripts/quality-audit/runner.ts` capturing status, timing, exit codes, and stdout/stderr
- [ ] T015 [P] [US1] Implement offline sample verification in `scripts/quality-audit/offline-sample-check.ts` using `client/src/lib/sample-data.ts`
- [ ] T016 [US1] Implement CLI entry in `scripts/quality-audit.ts` to parse flags, invoke auto-install/offline checks, execute runner, and add `quality:audit` script in `package.json`

**Checkpoint**: `npm run quality:audit` available locally with optional offline validation and reliable failure signaling.

---

## Phase 4: User Story 2 - Shareable Audit Report (Priority: P2)

**Goal**: Produce a machine-readable JSON report and CI workflow that publishes audit results, dependency advisories, and command metadata.

**Independent Test**: Trigger the GitHub Actions workflow on a pull request; confirm logs show the summary, `artifacts/quality-audit-report.json` matches the JSON schema, and outdated dependencies are listed with upgrade guidance.

### Implementation for User Story 2

- [ ] T017 [P] [US2] Add report validation test in `tests/quality-audit/report.spec.ts` using `contracts/quality-audit-report.schema.json`
- [ ] T018 [US2] Implement report generator in `scripts/quality-audit/report-writer.ts` to serialize run results and dependency advisories
- [ ] T019 [US2] Extend `scripts/quality-audit/runner.ts` to parse `npm outdated`/`npm audit` output into dependency advisories and sample-import validation results
- [ ] T020 [US2] Enhance CLI in `scripts/quality-audit.ts` to support `--report`, `--ci`, emit human summary, and publish metadata via `GITHUB_OUTPUT`
- [ ] T021 [US2] Create `.github/workflows/quality-audit.yml` to run the command with caching, upload the report artifact, and expose status checks

**Checkpoint**: CI surfaces audit artifacts and contract-compliant JSON for asynchronous review.

---

## Phase 5: User Story 3 - Quality Audit Runbook (Priority: P3)

**Goal**: Deliver contributor-facing documentation that explains setup, running the audit, interpreting failures, and scheduling dependency reviews.

**Independent Test**: From a fresh clone, follow the runbook to run the audit, interpret a simulated failure, and log dependency review follow-up without outside assistance.

### Implementation for User Story 3

- [ ] T022 [US3] Create contributor runbook `docs/runbooks/quality-audit.md` covering setup, offline guidance, failure triage, and dependency review cadence
- [ ] T023 [P] [US3] Update `README.md` to highlight the audit command and link to the runbook
- [ ] T024 [P] [US3] Update `specs/001-establish-quality-audit/quickstart.md` with failure interpretation cheatsheet and CI flag usage
- [ ] T025 [US3] Update `PACKAGE_UPDATE_STRATEGY.md` to integrate audit-generated advisories into the team’s upgrade workflow

**Checkpoint**: New contributors rely on the runbook to adopt the audit within 30 minutes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Align documentation for internal tooling and record validation evidence.

- [ ] T026 [P] Update `.github/copilot-instructions.md` with guidance on the quality audit command and artifacts
- [ ] T027 Record final dry-run notes in `specs/001-establish-quality-audit/checklists/validation.md` after executing `npm run quality:audit -- --ci --report artifacts/quality-audit-report.json`

---

## Dependencies & Execution Order

- **Setup (Phase 1)** must finish before foundational tooling changes to avoid conflicting directory assumptions.
- **Foundational (Phase 2)** depends on Setup and must complete before any user story work.
- **User Story 1 (Phase 3)** depends on Foundational and unlocks the MVP quality audit command.
- **User Story 2 (Phase 4)** depends on completion of User Story 1 to reuse the runner output.
- **User Story 3 (Phase 5)** depends on User Story 1/2 so documentation reflects the final tooling.
- **Polish (Phase 6)** depends on all user stories to summarize the final solution.

### Story Dependencies

1. US1 (P1) → US2 (P2) → US3 (P3)
2. US2 cannot start until the CLI returns structured results.
3. US3 documentation references both the CLI and CI artifacts.

## Parallel Execution Examples

- **User Story 1**: T011, T013, and T015 touch independent files (`tests/`, `scripts/quality-audit/auto-install.ts`, `scripts/quality-audit/offline-sample-check.ts`) and can proceed in parallel once T012 exists.
- **User Story 2**: T017 and T018 can run concurrently while T019 adjusts the runner; start T020 after runner changes land, then wire T021.
- **User Story 3**: T023 and T024 update separate markdown files and can be completed alongside T022/T025 once runbook structure is decided.

## Implementation Strategy

1. Complete Setup and Foundational phases to establish tooling and shared schemas.
2. Deliver MVP by finishing User Story 1 and validating `npm run quality:audit` locally.
3. Layer in CI reporting (User Story 2) to unblock remote reviews and dependency tracking.
4. Finalize contributor enablement (User Story 3) and polish documentation/artifact records.
5. After each story, run the audit to confirm independence before moving to the next phase.
