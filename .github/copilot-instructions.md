# ApiForge Copilot Instructions
## Architecture
- Local-first client persists workspaces/collections/etc in browser via `client/src/lib/local-storage-service.ts`; the Express server only handles cross-origin HTTP execution, OpenAPI import, and optionally persistence.
- Shared types and validation live in `shared/schema.ts`; always extend these before touching storage or UI, and reuse the Zod schemas on both sides.
- `client/src/lib/queryClient.ts` routes CRUD calls to localStorage and proxies `/api/requests/:id/(execute|history)` to the server; all query keys are joined path segments (e.g. `['/api/requests', id]`).
## Server
- Dev entrypoint is `server/index.ts`; `registerRoutes` in `server/routes.ts` wires REST handlers for workspaces, collections, folders, requests, environments, workflows, plus OpenAPI import and execution.
- Storage defaults to the seeded `MemStorage` (`server/storage.ts`); switch to `SqliteStorage` for persistence by exporting it and keep Drizzle migrations in `drizzle/` in sync.
- Execution flow: `environment-resolver.ts` resolves `{{vars}}` with scope priority, `http-executor.ts` performs the real fetch, `script-executor.ts` runs Postman-style scripts and can mutate env vars; be mindful to supply request/environment fallbacks when running against localStorage.
- Vite middleware (`server/vite.ts`) only runs in development; production expects `npm run build` to emit client assets to `dist/public` before `npm start`.
## Client
- `client/src/pages/Home.tsx` orchestrates sidebar selection, execution, environment editing, and debug capture; it relies on `@tanstack/react-query` mutations coupled with the custom `apiRequest`.
- Sidebar/creation dialogs (`AppSidebar.tsx`, `Create*Dialog.tsx`, `ImportDialog.tsx`) expect server-compatible payloads; when adding fields update both the dialogs and local storage handlers.
- `RequestBuilder.tsx` saves via `/api/requests/:id` and triggers execution through `apiRequest("POST", "/api/requests/${id}/execute", …)`; ensure new request fields are mirrored in execution logging (`DebugContext` + `DebugPanel`).
- Environment management uses scoped variables (`EnvironmentEditor.tsx`); scope IDs must be present for non-global vars so the resolver can match them.
## UI & Styling
- UI components come from the local shadcn copies under `client/src/components/ui`; keep design tokens in `tailwind.config.ts` aligned with `design_guidelines.md`.
- Routing uses Wouter (`App.tsx`) and theme toggling is handled in `components/ThemeProvider.tsx`; test dark/light layouts when adjusting layout primitives.
- Example compositions live under `client/src/components/examples/` for documentation; update them when changing API signatures.
## Quality Assurance
- Before committing code changes, run `npm run quality:audit` to validate linting, types, builds, tests, dependency health, and security.
- The audit command auto-installs dependencies if missing and produces a detailed JSON report in `artifacts/quality-audit-report.json`.
- Common audit fixes:
  - Lint issues: `npm run lint:fix`
  - Type errors: `npm run check` for diagnostics
  - Test failures: `npm run test` for interactive debugging
- See `docs/runbooks/quality-audit.md` for comprehensive troubleshooting guidance.
- CI enforces quality gates via `.github/workflows/quality-audit.yml` on all PRs; failing audits block merges.
## Workflows & Tooling
- Typical commands: `npm run dev` (Express + Vite HMR), `npm run build` (Vite client + `esbuild` server bundle), `npm start` (serve built bundle), `npm run check` (typecheck), `npm run db:push` (apply Drizzle schema), `npm run quality:audit` (comprehensive quality check).
- Browser data drives the app; resetting or seeding occurs through `LocalStorageService.clearAll()` or by loading the built-in sample via `createSampleData`.
- Scripts live in `scripts/` and use TypeScript executed via `tsx`; see `scripts/README.md` for conventions.
## Contribution Gotchas
- Whenever you touch data models, update `shared/schema.ts`, the server storage implementation(s), and the client local-storage adapter in tandem.
- Keep the localStorage router (`client/src/lib/local-storage-adapter.ts`) mirrored with Express endpoints so queries stay consistent online/offline.
- Remember to include resolved request data when extending execution responses; the client relies on `resolvedRequest` for DebugPanel output.
- Run the quality audit before pushing: `npm run quality:audit` catches common issues before CI.

