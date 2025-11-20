# Implementation Plan: Azure Static Web App Conversion

**Branch**: `001-azure-static-app` | **Date**: 2025-11-20 | **Spec**: [`spec.md`](./spec.md)
**Input**: Feature specification from `/specs/001-azure-static-app/spec.md`

## Summary

Migrate ApiForge to an Azure Static Web App that serves the offline-first Vite client while exposing the existing request execution pipeline through Azure Functions. Deliver GitHub Actions automation for preview/production slots, SWA routing and configuration, and production-ready observability/secrets so hosted users experience parity with the local build.

## Technical Context

**Language/Version**: TypeScript 5.6 + React 18 client, shared Zod schemas, Node.js server logic targeting Azure Functions Node 18 LTS (per Research Decision 1)  
**Primary Dependencies**: React, TanStack Query, shadcn/ui, shared `local-storage-service`, server utilities (`environment-resolver`, `http-executor`, `script-executor`) rehosted as HTTP-triggered Functions (Research Decision 5) with Azure metadata treated as read-only telemetry that syncs back to local storage  
**Hosting/CI**: Azure Static Web Apps Standard plan + two-stage GitHub Actions workflow (build/test → deploy) using `Azure/static-web-apps-deploy@v2` (Research Decision 2)  
**Storage**: Browser `local-storage-service` remains source of truth; SWA only provides execution + serving; optional cloud persistence deferred  
**Secrets**: SWA application settings per slot with optional Key Vault references for rotation (Research Decision 3)  
**Telemetry**: Application Insights auto-instrumentation with Azure Monitor alert rules for latency/error/cold-start KPIs (Research Decision 4)  
**Testing**: Vitest for shared/server utilities, importer fixtures (Postman/OpenAPI/curl) proving schema compatibility, integration tests for `local-storage-adapter`, and SWA deployment validation + smoke Playwright run hitting hosted Functions  
**Performance Goals**: Preserve sub-200 ms offline interactions; hosted request executions hit <2 s at P95 for <1 MB payloads  
**Constraints**: Local-first workflows must work without SWA; hosted flows cannot introduce breaking schema changes; no new auth per clarification  
**Scale/Scope**: Single SWA with preview + production slots, sized for small-team usage but following enterprise-ready governance

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Local-First Persistence**: Feature keeps `local-storage-service` untouched; plan will codify offline regression tests plus hosted smoke tests to ensure Azure hosting augments rather than replaces offline mode.
- [x] **Import Interoperability**: Import fixtures (Postman/OpenAPI/curl) will be updated and rerun to prove existing assets remain valid even after introducing hosted metadata fields.
- [x] **Onboarding Simplicity**: Quickstart doc will explain the extra "Deploy to Azure" path without adding required setup for local use; sample data remains unchanged.
- [x] **Quality & Audit Discipline**: Execution includes `npm run check`, targeted Vitest for server adapters, and Playwright smoke hitting the SWA preview; DebugPanel logging will include hosted execution metadata.
- [x] **Evergreen Dependencies**: Any Azure SDK / Actions updates will go through changelog review and `npm audit`; plan records the audit + verification steps before merge.

## Project Structure

### Documentation (this feature)

```text
specs/001-azure-static-app/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
client/
├── src/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   └── pages/
└── index.html

server/
├── environment-resolver.ts
├── http-executor.ts
├── routes.ts
├── script-executor.ts
└── vite.ts

shared/
└── schema.ts

.github/workflows/
└── (new) azure-static-web-app.yml (planned)

infrastructure/
└── azure-swa/ (planned IaC + SWA config)

tests/
├── integration.test.ts
├── local-storage-adapter.test.ts
└── quality-audit/
```

**Structure Decision**: Treat repo as a client+server+shared monorepo. Add `infrastructure/azure-swa/` for SWA config (routes, workflows) and `.github/workflows/azure-static-web-app.yml` for CI/CD.

## Implementation Approach

### Phase 1 — SWA Foundations & CI/CD
- Create `infrastructure/azure-swa/` containing `staticwebapp.config.json`, route rules, and deployment documentation.
- Author `.github/workflows/azure-static-web-app.yml` with `build-test` and `deploy` jobs described in Research Decision 2; wire preview vs production slots via environment protection rules.
- Introduce `api/` folder with Azure Functions scaffolding, shared ESLint/tsconfig, and npm scripts (`npm run dev:functions`, `npm run build:functions`).
- Add SWA CLI + Functions Core Tools guidance to README and `quickstart.md`.

### Phase 2 — Functions Backend Parity
- Port `environment-resolver.ts`, `http-executor.ts`, `script-executor.ts`, and related helpers into the Functions runtime (Research Decision 5) while keeping schemas in `shared/`.
- Implement bindings for `POST /api/requests/{requestId}/execute`, `GET /api/requests/{requestId}/history`, and promotion endpoints defined in `contracts/hosted-execution.openapi.yaml`.
- Update `client/src/pages/Home.tsx` + `RequestBuilder.tsx` to detect hosted mode, route API calls via SWA proxy, and surface hosted execution metadata in `DebugPanel`.
- Expand Vitest suites for server utilities and add Playwright smoke test hitting the SWA CLI-proxied backend.
- Extend importer/exporter fixtures (Postman, OpenAPI, curl) to include hosted metadata fields and ensure backward compatibility.

### Phase 3 — Operations, Observability, and Docs
- Capture Application Insights instrumentation plus Azure Monitor alert templates (latency, error rate, cold starts) and link them in runbooks.
- Finalize secret provisioning workflow using SWA application settings + optional Key Vault references per Research Decision 3; document mapping in `quickstart.md` and repo README.
- Publish deployment + rollback SOPs, update onboarding assets, and add evidence to `docs/runbooks/quality-audit.md`.
- Prepare `/speckit.tasks` with granular engineering tasks (Phase 2 of workflow) after this plan is approved.
- Establish measurement hooks for SC-001 through SC-004 (deployment timer, hosted latency load test, beta feedback log, incident tracking worksheet) and link outputs to `artifacts/quality-audit-report.json`.

## Testing Strategy

- **Automated**: `npm run check`, Vitest suites (`tests/*.test.ts`, new Functions-targeted tests), Playwright smoke hitting SWA CLI, and GitHub Actions workflow validations.
- **Manual**: SWA preview verification (request execution, offline fallback), Application Insights dashboard review, alert firing simulation, rollback drill.
- **Offline guarantee**: Repeat existing local smoke test to ensure `local-storage-service` flows remain unaffected when SWA backend is unavailable.

## Constitution Check (Post-Design)

- [x] **Local-First Persistence**: Functions integration is additive; plan mandates regression automation for offline mode plus UI detection when SWA proxy is unreachable.
- [x] **Import Interoperability**: Contracts reuse existing schemas; no importer changes required, but Playwright test will import a Postman sample to confirm parity.
- [x] **Onboarding Simplicity**: Quickstart isolates Azure deployment steps; default onboarding path stays two clicks using sample data.
- [x] **Quality & Audit Discipline**: Testing strategy enumerates lint/type/test + hosted smoke + alert validation; outputs feed into quality audit artifacts.
- [x] **Evergreen Dependencies**: Any new Azure SDK/CLI or GitHub Action version increments trigger changelog review + `npm audit` capture during CI logs.

## Complexity Tracking

No constitution violations pending; table not required.
