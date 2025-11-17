# Data Model: Baseline Quality Audit Process

## Entities

### QualityAuditStep
- **Fields**
  - `id`: string (stable identifier such as `lint`, `typecheck`, `build`, `vitest`, `outdated`, `audit`)
  - `label`: human-readable name for reporting (e.g., "ESLint linting")
  - `command`: npm script or executable invoked (`npm run lint`, `npm run build`)
  - `category`: enum (`lint`, `type`, `build`, `test`, `dependency`, `security`)
  - `required`: boolean (true when failure blocks merge; allows optional future steps)
  - `description`: short guidance displayed in runbook and report
- **Validation**
  - `id` must be unique across the checklist
  - `command` must reference an npm script defined in `package.json`
  - Required steps MUST cover the six baseline categories listed in the spec
- **Relationships**
  - Aggregated within a `QualityAuditChecklist`

### QualityAuditChecklist
- **Fields**
  - `version`: semver string for the checklist definition (e.g., `1.0.0`)
  - `steps`: ordered array of `QualityAuditStep`
  - `autoInstall`: boolean flag indicating whether the audit runner should auto-install dependencies when absent
- **Validation**
  - Steps array must not be empty and must include at least one step per baseline category
  - Checklist version is bumped when steps or defaults change
- **Relationships**
  - Consumed by the CLI runner (`scripts/quality-audit.ts`)
  - Referenced in the contributor runbook

### QualityAuditRun
- **Fields**
  - `id`: UUID generated per run
  - `startedAt` / `finishedAt`: ISO timestamps
  - `runner`: enum (`local`, `ci`) with optional metadata (user, hostname, git SHA)
  - `steps`: array of `QualityAuditResult`
  - `status`: enum (`passed`, `failed`, `skipped`)
  - `reportPath`: relative file path written to disk (defaults to `artifacts/quality-audit-report.json`)
- **Validation**
  - `finishedAt` ≥ `startedAt`
  - `status` derived from step outcomes (`failed` if any required step fails)
- **Relationships**
  - JSON artifact uploaded by CI and referenced in PR comments or release notes

### QualityAuditResult
- **Fields**
  - `stepId`: references `QualityAuditStep.id`
  - `status`: enum (`passed`, `failed`, `skipped`)
  - `startedAt` / `finishedAt`: ISO timestamps for the step
  - `exitCode`: integer (null when skipped)
  - `stdout` / `stderr`: truncated text snippets for diagnostics
  - `notes`: optional developer guidance (e.g., "run npm run lint -- --fix")
- **Validation**
  - `stepId` MUST match a step present in the checklist version used for the run
  - Duration (`finishedAt - startedAt`) must be non-negative
  - Required steps may not be marked `skipped`

### DependencyAdvisory
- **Fields**
  - `package`: string
  - `currentVersion`: string
  - `latestVersion`: string
  - `severity`: enum (`low`, `moderate`, `high`, `critical`, `info`)
  - `type`: enum (`outdated`, `vulnerability`)
  - `advisoryUrl`: optional string pointing to changelog or CVE
- **Validation**
  - Versions must respect semver formatting
  - `severity` required for vulnerability entries
- **Relationships**
  - Embedded within the JSON audit report under `dependencies`

## State Transitions

1. **Checklist Update**
   - Maintainer edits `QualityAuditChecklist` (e.g., adds Playwright step)
   - Increment checklist `version`
   - Document changes in runbook, regenerate fixtures/tests verifying required categories

2. **Audit Run**
   - Runner loads checklist; ensures dependencies installed (auto-install when `autoInstall=true` and `node_modules` missing)
   - Executes steps sequentially, generating `QualityAuditResult` items
   - Aggregates into `QualityAuditRun` with derived `status`
   - Writes JSON artifact and console summary

3. **CI Publication**
   - GitHub Actions workflow triggers audit run in `ci` mode
   - Uploads `QualityAuditRun` JSON to `actions/upload-artifact`
   - Posts summary to job logs (potential future: PR comment)

4. **Remediation Workflow**
   - When `DependencyAdvisory` entries contain high/critical severity or major version drift, GitHub Action raises follow-up issue (Phase 2 consideration)
   - Developers update package, re-run audit to confirm `status=passed`
