# Quality Audit Quickstart

## 1. Prerequisites
- Node.js 20.x and npm 10.x installed.
- Fresh clone with no uncommitted changes.

## 2. Install dependencies
```bash
npm ci
```

> Skip manually when running inside the audit command; it installs automatically if `node_modules` is missing.

## 3. Run the audit locally
```bash
npm run quality:audit
```

- Human-readable results stream to the console.
- Detailed JSON written to `artifacts/quality-audit-report.json`.

## 4. Review failures
- Check console output for failing steps.
- Inspect the JSON report for structured error payloads.

## 5. Re-run targeted steps
```bash
npm run lint
npm run build
npm run test -- --run --reporter=basic
```

## 6. Verify CI integration
- Push your branch; GitHub Actions workflow `quality-audit.yml` executes the same command in `--ci` mode.
- Failing audit blocks merges via required status check.

## 7. Export artifacts (optional)
```bash
npm run quality:audit -- --report artifacts/audit-report-ci.json --ci
cat artifacts/audit-report-ci.json
```

---

## Failure Interpretation Cheatsheet

### Lint Failures (ESLint)
- **Quick fix**: `npm run lint:fix`
- **Manual review**: Check reported files and line numbers
- **Common issues**: Unused imports, console.log statements, type errors

### Type Check Failures (TypeScript)
- **Full output**: `npm run check`
- **Common issues**: Missing type definitions, incompatible types, strict mode violations
- **Fix strategy**: Address one file at a time, starting with the first error

### Build Failures
- **Detailed logs**: `npm run build`
- **Common issues**: Import errors, missing dependencies, syntax errors in config files
- **Check**: Ensure all imports resolve correctly

### Test Failures
- **Interactive mode**: `npm run test` (watch mode)
- **CI output**: Review `artifacts/test-results.xml` and `artifacts/test-results.json`
- **Debug**: Run specific test file with `npm run test -- tests/path/to/file.spec.ts`

### Outdated Dependencies
- **Review report**: Check severity and version delta
- **Minor updates**: Generally safe to apply
- **Major updates**: Review changelogs before upgrading
- **Document decisions**: Update `PACKAGE_UPDATE_STRATEGY.md`

### Security Vulnerabilities
- **Auto-fix**: `npm audit fix` (applies compatible patches)
- **High/Critical**: Must be addressed before merge
- **No fix available**: Document risk acceptance and create tracking issue
- **False positives**: Verify and document waiver rationale

---

## CI Flag Usage

When running with `--ci`:
- Fail-fast mode: stops on first required step failure
- Skipped security steps are treated as failures
- Outputs metadata to `GITHUB_OUTPUT` for workflow integration
- Returns non-zero exit code on failure for status checks

Example CI command:
```bash
npm run quality:audit -- --ci --report artifacts/quality-audit-report.json
```

---

## Offline Development

Verify offline capability with:
```bash
npm run quality:audit -- --offline-sample
```

This validates that sample data can be loaded without network access, ensuring local-first architecture compliance.

