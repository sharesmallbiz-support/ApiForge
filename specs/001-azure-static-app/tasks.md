# Tasks: Azure Static Web App Conversion

**Input**: Design documents from `/specs/001-azure-static-app/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Run `npm run check`, targeted Vitest for local-storage + Functions code, and Playwright smoke hitting SWA CLI to verify offline parity whenever tasks touch execution flows.

## Phase 1: Setup (Shared Infrastructure)
**Purpose**: Establish baseline structure and tooling before feature work.

- [X] T001 Create `infrastructure/azure-swa/README.md` outlining SWA resource topology, required Azure CLI versions, and deployment tokens.
- [X] T002 Scaffold `infrastructure/azure-swa/staticwebapp.config.template.json` with route rewrites for `/api/*` and offline fallbacks.
- [X] T003 [P] Introduce the `api/` workspace (Functions host) with `package.json`, `tsconfig.json`, and `host.json` mirroring repo ESLint/TS configs.
- [X] T004 [P] Add SWA CLI + Functions scripts (`dev:functions`, `swa:start`) to `package.json` plus document usage in `README.md`.

---

## Phase 2: Foundational (Blocking Prerequisites)
**Purpose**: Align schemas, storage, and tests so user stories can build on a consistent base.

- [X] T005 Update `shared/schema.ts` to model `DeploymentEnvironment`, `SecretBinding`, `FunctionApp`, `TelemetrySignal`, and new `ExecutionRequest` hosted fields.
- [X] T006 Propagate schema changes to storage layers (`client/src/lib/local-storage-service.ts`, `server/storage.ts`, `server/sqlite-storage.ts`) ensuring offline persistence works.
- [ ] T007 [P] Refresh adapters/tests (`tests/local-storage-adapter.test.ts`, `tests/integration.test.ts`) to assert hosted metadata stays optional offline.
- [ ] T008 [P] Seed sample data + resolver defaults in `client/src/lib/local-storage-adapter.ts` for hosted run metadata so UI can render before Azure deploys.
- [ ] T009 Document local vs hosted execution modes and prerequisites in `docs/runbooks/quality-audit.md` and `specs/001-azure-static-app/quickstart.md`.
- [ ] T010 [P] Extend Postman/OpenAPI importer fixtures (`tests/postman-parser.test.ts`, `tests/integration.test.ts`) to cover hosted metadata fields and prove backward compatibility.
- [ ] T011 [P] Update curl importer (`shared/curl-parser.ts` + `tests/curl-parser.test.ts`) so new schema attributes are ignored gracefully and fixtures include hosted samples.

**Checkpoint**: Schema + storage ready; proceed to user stories.

---

## Phase 3: User Story 1 – Ship production-grade SWA (Priority: P1) 🎯 MVP
**Goal**: Provide automated SWA deployments (preview + production) with GitHub Actions, routing, and documentation.
**Independent Test**: Trigger `.github/workflows/azure-static-web-app.yml` on a clean clone and confirm preview + production slots complete successfully with static + Functions artifacts available in the Azure portal.

### Implementation
- [X] T012 [US1] Author `infrastructure/azure-swa/staticwebapp.config.json` (non-template) with final route rules, headers, and offline fallbacks consumed by deployments.
- [X] T013 [P] [US1] Create `.github/workflows/azure-static-web-app.yml` featuring `build-test` (npm install + `npm run check` + `npm run test`) and `deploy` (preview on PR, production on `main`) jobs using `Azure/static-web-apps-deploy@v2`.
- [X] T014 [US1] Add secret mapping guidance + slot configuration steps to `specs/001-azure-static-app/quickstart.md` and `README.md` (linking SWA application settings + Key Vault practice).
- [X] T015 [P] [US1] Build `infrastructure/azure-swa/parameters.example.json` documenting required SWA resource names, resource groups, and Insights links for reuse.
- [ ] T016 [US1] Validate the workflow end-to-end (dry run using SWA CLI token) and capture evidence in `artifacts/quality-audit-report.json` under a new "swa-deploy" section.
- [ ] T017 [US1] Instrument the GitHub Action to record total deployment duration (SC-001) and store metrics + commit SHA in `artifacts/quality-audit-report.json`.

**Checkpoint**: SWA deployment pipeline operational; preview + production slots available.

---

## Phase 4: User Story 2 – Execute requests through Functions API (Priority: P2)
**Goal**: Rehost the executor inside Azure Functions and keep client UX identical across hosted/local modes.
**Independent Test**: From the deployed SWA preview, execute a sample request and compare payload + history with the same request run via `npm run dev`; results and DebugPanel traces must match.

### Implementation
- [X] T018 [US2] Port `server/http-executor.ts`, `environment-resolver.ts`, and `script-executor.ts` into `api/execute-request/index.ts` with shared imports and Node 18 isolated worker configuration.
- [X] T019 [P] [US2] Implement `api/request-history/index.ts` as a read-only view that mirrors local execution history and enriches entries with hosted telemetry (no new canonical storage), aligning responses to `ExecutionResult`.
- [X] T020 [P] [US2] Add `api/promote-deployment/index.ts` to proxy promotion requests to GitHub Actions while validating source commit freshness per `contracts/hosted-execution.openapi.yaml`.
- [ ] T021 [US2] Update `client/src/pages/Home.tsx`, `components/RequestBuilder.tsx`, and `components/DebugPanel.tsx` to detect hosted mode via SWA env vars, toggle API base URLs, and display `hostedRunUrl`.
- [ ] T022 [P] [US2] Extend `client/src/contexts/DebugContext.tsx` + local storage adapters to save `lastHostedRun`/`hostedRunResult` metadata without impacting offline mode.
- [ ] T023 [US2] Add Vitest coverage for Functions helpers (`tests/functions/execute-request.test.ts`) mocking Azure bindings.
- [ ] T024 [P] [US2] Create a Playwright smoke test (`tests/integration/hosted-execution.spec.ts`) that runs via `swa start` to verify parity between hosted and local execution flows.
- [ ] T025 [US2] Run a hosted load/performance suite (Playwright/Artillery) to measure P95 latency (<2s) and log results + comparison with local runs in `docs/runbooks/quality-audit.md` (SC-002).
- [ ] T025a [US2] Implement and test client-side fallback behavior in `pages/Home.tsx` for when SWA middleware is unavailable, ensuring the app gracefully degrades to a read-only or local-only mode as per the edge case in `spec.md`.
- [ ] T025b [US2] Define and implement client-side retry/backoff logic in `lib/queryClient.ts` for long-running requests that might time out due to Azure Functions cold starts, surfacing the status to the user.

**Checkpoint**: Hosted execution fully mirrors local behavior; users can switch between runtimes seamlessly.

---

## Phase 5: User Story 3 – Operate and audit Azure environments (Priority: P3)
**Goal**: Provide observability, secret governance, and rollback guidance for SWA deployments.
**Independent Test**: Review Application Insights dashboards + Azure Monitor alerts and confirm they track latency/error/cold-start KPIs while runbooks describe remediation + rollback without Azure portal guesswork.

### Implementation
- [ ] T026 [US3] Wire Application Insights telemetry (connection string + sampling) into `api/shared/telemetry.ts` and ensure each Function logs trace IDs + hostedRun URLs.
- [ ] T027 [P] [US3] Define Azure Monitor alert templates (`infrastructure/azure-swa/alerts.bicep`) for P95 latency, failure rate, and cold-start counts tied to notification hooks.
- [ ] T028 [US3] Document secret rotation + environment mapping workflows in `docs/runbooks/quality-audit.md`, covering SWA settings and Key Vault references per slot.
- [X] T029 [P] [US3] Publish operations + rollback SOPs in `docs/runbooks/rollback.md`, including how to redeploy previous artifacts, export/import local-storage snapshots, and rehydrate sample workspaces after SWA recovery.
- [ ] T029a [US3] Extend `docs/runbooks/rollback.md` to also cover the step-by-step process for promoting a build from a preview environment to production, including pre-flight validation checks.
- [ ] T030 [US3] Add dashboard/screenshots + alert test evidence to `artifacts/quality-audit-report.json` so CI captures observability readiness.
- [X] T031 [US3] Create an incident log template (`docs/runbooks/operations-log.md`) and automation to record hosted incidents/month, ensuring SC-004 tracking stays below target.
- [ ] T032 [US3] Stand up a beta feedback intake (issue template or survey) that captures hosted vs local regression sentiment and summarize ≥90% success evidence in `docs/beta-feedback/` for SC-003.

**Checkpoint**: Operations team can monitor, alert, and recover the SWA deployment confidently.

---

## Phase 6: Polish & Cross-Cutting Concerns
**Purpose**: Final hardening once all stories land.

- [ ] T033 [P] Consolidate documentation updates (README, quickstart, `docs/runbooks/quality-audit.md`) ensuring local + SWA paths stay in sync.
- [ ] T034 Address performance/regression fixes uncovered during hosted runs (optimize bundle sizes, cold-start mitigation) in `client/vite.config.ts` and `api/`.
- [ ] T035 [P] Run `npm run quality:audit`, attach the report to `artifacts/quality-audit-report.json`, and fix any blocking findings.
- [ ] T036 Capture final demo evidence (screenshots/video) showing local + hosted parity and store references in `docs/runbooks/quality-audit.md`.

---

## Dependencies & Execution Order
- **Setup → Foundational**: Phase 2 cannot begin until infrastructure scaffolding + scripts exist.
- **Foundational → All User Stories**: Schema/storage/importer updates (T005–T011) are prerequisites for US1–US3.
- **User Stories**: Can proceed in priority order or in parallel once Foundational is done. US2 depends on workflow artifacts from US1 (Functions deploy via pipeline). US3 depends on US1 (SWA resources live) and US2 (telemetry + hosted metadata available).
- **Polish**: Runs after desired user stories complete.

## Parallel Opportunities
- Tasks marked `[P]` do not share files and can run concurrently (e.g., T003 vs T004, T013 vs T015, T019 vs T020, T022 vs T024, T027 vs T029, T033 vs T035).
- Different teams can own distinct user stories after Foundational completion (US1 vs US2 vs US3).
- Testing tasks (T020–T021, T029) can execute while documentation tasks progress since they target separate directories.

## Implementation Strategy
1. **MVP (US1)**: Finish Setup + Foundational, deliver SWA pipeline (T012–T017) so a hosted build exists with measurable deployment timing.
2. **Parity (US2)**: Port executor + UI wiring (T018–T025) to guarantee users can run requests locally or via SWA without regression and hit latency targets.
3. **Operations (US3)**: Layer monitoring, secrets, runbooks, user-feedback, and incident tracking (T026–T032) to satisfy governance and success metrics.
4. **Polish**: Close documentation + audit loops (T033–T036) and ensure quality gates remain green.
