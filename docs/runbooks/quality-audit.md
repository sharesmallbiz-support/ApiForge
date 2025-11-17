# Quality Audit Runbook

## Overview

The quality audit is a comprehensive validation process that runs linting, type checking, production builds, smoke tests, dependency health checks, and security scans. This runbook guides you through running the audit locally, interpreting results, and responding to failures.

## Prerequisites

- Node.js 20.x or later
- npm 10.x or later
- Git repository cloned locally

## Running the Audit

### Local Development

```bash
# Basic audit (auto-installs dependencies if needed)
npm run quality:audit

# With offline sample verification
npm run quality:audit -- --offline-sample

# Custom report location
npm run quality:audit -- --report artifacts/my-audit.json
```

### CI Mode

```bash
# Fail-fast mode for CI (stops on first failure)
npm run quality:audit -- --ci

# CI with offline verification
npm run quality:audit -- --ci --offline-sample
```

### Environment Variables

- `APIFORGE_AUDIT_LOG_LEVEL`: Set to `debug` for verbose output, `silent` to suppress logs
- `APIFORGE_SKIP_AUTO_INSTALL`: Set to `1` to bypass automatic `npm ci` (for cached CI runs)

## Understanding Results

### Console Output

The audit prints a summary showing:
- Overall status (PASSED/FAILED)
- Duration
- Step-by-step results with icons:
  - ✓ = Passed
  - ✗ = Failed
  - ○ = Skipped

### JSON Report

Located at `artifacts/quality-audit-report.json`, the report contains:
- Structured step results
- Dependency advisories (outdated packages, vulnerabilities)
- Timing metrics
- Exit codes and error details

## Troubleshooting Common Failures

### Lint Failures

**Symptom**: `ESLint validation` step fails

**Fix**:
```bash
# Auto-fix most issues
npm run lint:fix

# Review remaining issues
npm run lint
```

### Type Check Failures

**Symptom**: `TypeScript type checking` step fails

**Fix**:
1. Run `npm run check` to see full error output
2. Address type errors in the reported files
3. Consider adding type assertions or fixing type definitions

### Build Failures

**Symptom**: `Production build` step fails

**Fix**:
1. Check for import errors or missing dependencies
2. Verify `vite.config.ts` and `tsconfig.json` are valid
3. Run `npm run build` directly for detailed error messages

### Test Failures

**Symptom**: `Vitest smoke tests` step fails

**Fix**:
1. Run `npm run test` for interactive test runner
2. Review test output in `artifacts/test-results.json`
3. Fix failing tests and re-run

### Outdated Dependencies

**Symptom**: `Dependency health check` step shows warnings

**Response**:
1. Review the dependency advisories in the report
2. For major version updates, check changelogs for breaking changes
3. Update dependencies incrementally and test
4. Document upgrade decisions in `PACKAGE_UPDATE_STRATEGY.md`

### Security Vulnerabilities

**Symptom**: `Security vulnerability scan` step fails or shows high/critical issues

**Response**:
1. Review vulnerability details in the report or run `npm audit`
2. For fixable issues: `npm audit fix`
3. For unfixable issues:
   - Check if a patch is in progress
   - Document accepted risk if no immediate fix available
   - Create tracking issue for follow-up

### Network Failures

**Symptom**: Dependency or security steps are skipped

**Response**:
- Ensure internet connectivity for npm registry access
- The audit retries twice before marking steps as skipped
- In CI mode, skipped security steps cause failure
- Re-run the audit when connectivity is restored

## Offline Development

The audit respects the local-first architecture:

```bash
# Verify offline capability
npm run quality:audit -- --offline-sample
```

This checks that sample data can be loaded without network access. The audit itself requires network for security checks but gracefully handles offline scenarios.

## Dependency Review Cadence

### Weekly
- Monitor audit reports for new advisories
- Triage any new high/critical vulnerabilities

### Monthly
- Review outdated dependencies
- Plan upgrade sprints for major version updates
- Update `PACKAGE_UPDATE_STRATEGY.md` with decisions

### Per-PR
- All PRs must pass the quality audit
- Address failures before requesting review
- Document any approved waivers in PR description

## CI Integration

The GitHub Actions workflow runs automatically on:
- Pull requests to `main` or `develop`
- Direct pushes to `main` or `develop`

### Workflow Features
- Caches npm dependencies for faster runs
- Enforces 8-minute runtime threshold
- Uploads audit report as artifact
- Posts failure summary as PR comment

### Viewing Reports
1. Navigate to Actions tab in GitHub
2. Select the workflow run
3. Download "quality-audit-report" artifact

## Troubleshooting Audit Command

### Command Not Found

```bash
# Ensure dependencies are installed
npm install

# Verify script exists
cat package.json | grep quality:audit
```

### Permission Issues

```bash
# On Unix systems, ensure scripts are executable
chmod +x scripts/quality-audit.ts
```

### Timeout Errors

The audit has a 5-minute timeout per step. If a step times out:
1. Check for hanging processes
2. Review system resources
3. Run the specific step manually to diagnose

## Getting Help

1. Check this runbook for common issues
2. Review the audit report JSON for detailed errors
3. Consult `scripts/README.md` for automation conventions
4. Ask in team chat with audit report attached
