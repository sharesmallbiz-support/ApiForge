# Research Notes: Baseline Quality Audit Process

- **Decision**: Adopt ESLint with `@typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, and `eslint-config-prettier` as the linting stack.
  - **Rationale**: ESLint remains the industry standard for TypeScript + React projects, integrates cleanly with Vite, and supports granular rule control. The chosen plugin set covers core TypeScript correctness, React best practices, accessibility, and Prettier compatibility so formatting conflicts do not fail the audit.
  - **Alternatives considered**: Biome (lints + formats) — rejected because it would replace the existing Prettier workflow and requires broader repo changes; StandardJS — lacks TypeScript-first rules and accessibility coverage.

- **Decision**: Use Vitest for the unit smoke phase and reserve Playwright for optional future regression coverage.
  - **Rationale**: Vitest is the Vite-native test runner with fast cold starts, allowing the audit to execute existing or new unit tests without additional bundling configuration. Keeping Playwright optional ensures the baseline audit finishes within the 8-minute budget while still enabling future E2E suites.
  - **Alternatives considered**: Jest — heavier to configure alongside Vite and duplicates tooling; Cypress — optimized for interactive E2E rather than quick CLI smoke runs.

- **Decision**: Implement the audit orchestrator as a TypeScript script (`scripts/quality-audit.ts`) executed via `tsx` that sequentially runs each check with `execa` and aggregates results.
  - **Rationale**: A dedicated Node script is cross-platform, allows richer logging/reporting than chained shell scripts, and keeps logic in TypeScript where the team already works. `tsx` is already available, so no extra runtime dependencies are required.
  - **Alternatives considered**: `npm-run-all` or `concurrently` shell composition — harder to capture rich per-step metadata; Makefile — not portable to Windows contributors.

- **Decision**: Emit the machine-readable report as JSON to `artifacts/quality-audit-report.json` containing per-check status, start/end timestamps, stderr summaries, outdated package list, and vulnerability advisories.
  - **Rationale**: JSON is trivial to parse in CI, retains structured metadata for future dashboards, and is supported by GitHub artifact tooling without extra conversion.
  - **Alternatives considered**: JUnit XML — geared toward test results only; Markdown — human-readable but harder for automation to consume.

- **Decision**: Publish the audit through a new GitHub Actions workflow (`.github/workflows/quality-audit.yml`) that runs on pull requests and release branches using Node 20, caches `~/.npm`, and uploads the JSON report.
  - **Rationale**: GitHub Actions is already the default for OSS Node projects, offers built-in caching + artifact uploads, and keeps the baseline enforceable for every merge event.
  - **Alternatives considered**: Replit-native CI or local-only enforcement — would not guarantee coverage on forks or enforceable merge gates.

- **Decision**: Detect missing dependencies by checking for `node_modules/.modules.yaml` (pnpm) and `node_modules/.package-lock.json` presence, falling back to `fs.existsSync('node_modules')`, and run `npm ci` automatically when absent.
  - **Rationale**: Ensures fresh clones or CI jobs without cache remain effortless, while cached environments skip redundant installs. Using `npm ci` guarantees lockfile fidelity so audit results are reproducible.
  - **Alternatives considered**: Always running `npm ci` — wastes time on local runs; requiring manual installs — fails the onboarding simplicity goal.
