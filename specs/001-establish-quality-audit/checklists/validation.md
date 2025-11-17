# Quality Audit Validation Checklist

**Feature**: Baseline Quality Audit Process  
**Date**: 2025-11-16  
**Validation Run**: Post-implementation dry run

## Pre-Validation Setup

- [ ] Clean working tree (no uncommitted changes)
- [ ] Fresh clone or `npm ci` completed
- [ ] Node.js 20.x and npm 10.x confirmed via `node --version` and `npm --version`

## Core Functionality Validation

### Local Execution

- [ ] `npm run quality:audit` completes successfully
- [ ] Console output shows step-by-step progress
- [ ] Report generated at `artifacts/quality-audit-report.json`
- [ ] Report contains all expected sections (version, timestamp, summary, steps)
- [ ] Exit code is 0 on success, 1 on failure

### Offline Sample Verification

- [ ] `npm run quality:audit -- --offline-sample` runs successfully
- [ ] Offline check validates sample data structure
- [ ] Audit continues after offline verification

### CI Mode

- [ ] `npm run quality:audit -- --ci` runs with fail-fast behavior
- [ ] Failed steps skip subsequent required steps in CI mode
- [ ] Skipped security steps cause failure in CI mode
- [ ] GITHUB_OUTPUT metadata published (if env var set)

### Custom Report Path

- [ ] `npm run quality:audit -- --report artifacts/custom-report.json` creates file at specified location
- [ ] Report content matches default report structure

## Step Validation

### Lint Step

- [ ] ESLint runs successfully on current codebase
- [ ] Failures reported with exit code and stderr
- [ ] Remediation guidance included in notes

### Type Check Step

- [ ] `npm run check` (tsc --noEmit) executes
- [ ] Type errors surfaced in report
- [ ] Exit code captured correctly

### Build Step

- [ ] Production build completes
- [ ] Build artifacts created in `dist/`
- [ ] Build failures captured with diagnostics

### Test Step

- [ ] Vitest runs in CI mode
- [ ] Test results written to `artifacts/test-results.xml` and `artifacts/test-results.json`
- [ ] Test failures reported with details

### Dependency Step

- [ ] `npm outdated --json` executes
- [ ] Outdated packages parsed into dependency advisories
- [ ] Current and latest versions captured

### Security Step

- [ ] `npm audit --json` executes
- [ ] Vulnerabilities parsed with severity levels
- [ ] Advisory URLs included when available
- [ ] Retries twice on network failures before marking skipped

## Report Validation

### JSON Schema Compliance

- [ ] Report matches `contracts/quality-audit-report.schema.json`
- [ ] All required fields present (version, timestamp, summary, steps)
- [ ] Step durations calculated correctly (finishedAt - startedAt)
- [ ] Status values valid (`passed`, `failed`, `skipped`)

### Dependency Advisories

- [ ] Outdated packages listed with versions and severity
- [ ] Vulnerabilities listed with CVE URLs (if available)
- [ ] Advisory type correctly marked (`outdated` vs `vulnerability`)

## CI Integration Validation

### GitHub Actions Workflow

- [ ] `.github/workflows/quality-audit.yml` exists
- [ ] Workflow triggers on PRs to main/develop
- [ ] Node 20 setup step included
- [ ] npm cache configured
- [ ] Quality audit runs with `--ci` flag
- [ ] Runtime threshold check enforces 8-minute limit
- [ ] Report uploaded as artifact with 30-day retention
- [ ] Test results uploaded as separate artifact
- [ ] PR comment posted on failure

### Runtime Instrumentation

- [ ] Workflow captures job duration in milliseconds
- [ ] Duration compared against 480000ms threshold
- [ ] Failure triggered if threshold exceeded

## Documentation Validation

### Runbook

- [ ] `docs/runbooks/quality-audit.md` comprehensive and accurate
- [ ] Troubleshooting section covers common failures
- [ ] Environment variable documentation complete
- [ ] Dependency review cadence documented

### README Updates

- [ ] `README.md` mentions quality audit command
- [ ] Link to runbook included

### Quickstart

- [ ] `specs/001-establish-quality-audit/quickstart.md` has failure interpretation guide
- [ ] CI flag usage documented
- [ ] Offline sample instructions included

### Package Strategy

- [ ] `PACKAGE_UPDATE_STRATEGY.md` integrates audit advisories
- [ ] Triage process documented
- [ ] Weekly/monthly review cadence defined

## Constitution Compliance

- [ ] Local-first persistence: Audit reads sample data without network
- [ ] Import interoperability: Audit does not modify import flows
- [ ] Onboarding simplicity: New contributors can run audit in <30 minutes
- [ ] Quality discipline: All required checks enforced
- [ ] Evergreen dependencies: Outdated detection integrated

## Edge Case Validation

### Auto-Install

- [ ] Audit detects missing `node_modules` and runs `npm ci`
- [ ] `APIFORGE_SKIP_AUTO_INSTALL=1` bypasses install
- [ ] Cached CI environments respect skip flag

### Network Failures

- [ ] Registry-dependent steps retry twice on failure
- [ ] Steps marked `skipped` after retries exhausted
- [ ] Skipped security steps fail in CI mode
- [ ] Guidance provided for re-running with connectivity

### Runtime Threshold

- [ ] CI workflow fails if audit exceeds 8 minutes
- [ ] Duration metrics captured in workflow output

## Post-Validation Cleanup

- [ ] Audit artifacts reviewed and archived
- [ ] Validation notes documented in this checklist
- [ ] Issues logged for any failures or gaps
- [ ] Implementation marked complete in tasks.md

---

## Validation Result

**Status**: [ ] PASS / [ ] FAIL

**Executed By**: _________________

**Date**: _________________

**Notes**:
- 
- 
- 

**Issues Found**:
- 
- 
-
