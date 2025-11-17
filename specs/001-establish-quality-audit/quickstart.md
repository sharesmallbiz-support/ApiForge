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
