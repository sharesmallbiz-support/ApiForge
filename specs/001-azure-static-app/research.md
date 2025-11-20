# Phase 0 Research — Azure Static Web App Conversion

**Date**: 2025-11-20  
**Context**: Resolve Technical Context clarifications and capture best practices for hosting ApiForge on Azure Static Web Apps.

## Decision 1: Target Azure Functions Node 18 LTS runtime
**Rationale**: Node 18 is the current long-term support runtime for Azure Functions and matches the repository's Node 18 toolchain, minimizing polyfill drift and aligning with Static Web Apps defaults. Aligning client build tooling (Vite, TS 5.6) with the same LTS reduces bundler/runtime incompatibilities and keeps `environment-resolver`/`script-executor` logic unchanged.
**Alternatives considered**: Node 20 (preview in SWA, not GA for production); Node 16 (supported but nearing retirement, would require additional backports and limit durable features).

## Decision 2: Use a two-stage GitHub Actions pipeline (build/test → deploy)
**Rationale**: Separating build/test from deployment allows cached dependency installs, surfaces lint/type/test failures before provisioning Azure resources, and reuses artifacts across preview and production slots. The official `Azure/static-web-apps-deploy@v2` action natively supports SWA preview/staging, secret injection, and environment promotions while keeping IaC changes under version control.
**Alternatives considered**: Single job pipeline (simpler but blocks reuse and slows feedback when deployment steps fail); Azure DevOps pipelines (powerful but outside current GitHub-based workflow and would add onboarding friction).

## Decision 3: Store secrets in SWA-managed application settings with optional Key Vault references
**Rationale**: Static Web Apps exposes per-environment secrets that are encrypted at rest, scoped per slot, and retrievable by Functions without bundling sensitive data inside the client. Key Vault references allow future rotation automation without code changes; mapping secrets by slot (e.g., `EXECUTOR_API_KEY__PROD`) simplifies GitHub Action inputs and prevents leaking preview credentials.
**Alternatives considered**: Hardcoding credentials in GitHub Action secrets (works but duplicates values per workflow and complicates rotation); storing secrets in client env files (violates zero-trust guidance and risks exposure in static artifacts).

## Decision 4: Instrument Functions with Application Insights + Azure Monitor alerts
**Rationale**: Application Insights automatically captures request, dependency, and custom trace telemetry for Functions with negligible setup. Wiring these logs into Azure Monitor alert rules enables latency/error/cold-start thresholds plus webhook/email notification, satisfying the spec's observability success criteria. Dashboards can be shared directly with platform owners without duplicating logging code.
**Alternatives considered**: Log Analytics-only workspace (flexible queries but requires manual alert setup and misses distributed tracing); custom logging via third-party APM (unnecessary complexity and cost for current scope).

## Decision 5: Rehost Express execution flow as isolated HTTP-triggered Functions
**Rationale**: Porting `http-executor.ts`, `environment-resolver.ts`, and `script-executor.ts` into an HTTP-triggered Azure Function keeps request semantics identical while benefiting from Functions' scaling and managed identity. The isolated worker + shared `shared/schema.ts` approach avoids coupling to Express middleware and allows both local emulator (`func start`) and SWA CLI to simulate the backend.
**Alternatives considered**: Running Express inside Azure Container Apps (more flexibility but overkill for static hosting and introduces container management); rewriting the executor in C#/.NET (native to Azure but would fork the logic and duplicate schema validation).
