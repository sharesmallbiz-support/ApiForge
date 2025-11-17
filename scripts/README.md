# Scripts Directory

This directory contains reusable Node.js/TypeScript automation scripts for ApiForge.

## Purpose

Centralize automation tooling for quality audits, builds, and maintenance tasks that operate independently of the main client/server application code.

## Conventions

- **Language**: TypeScript executed via `tsx` (already available in devDependencies)
- **Entry Points**: Scripts should be executable via `npm run` commands defined in `package.json`
- **Error Handling**: All scripts must exit with appropriate codes (0 = success, 1 = failure, 2 = misconfiguration)
- **Logging**: Use structured console output; respect `APIFORGE_AUDIT_LOG_LEVEL` for verbosity control
- **Cross-Platform**: Avoid platform-specific shell commands; use Node.js APIs or `execa` for process spawning

## Current Scripts

### quality-audit.ts

Orchestrates the baseline quality audit process including:
- Linting (ESLint)
- Type checking (TypeScript)
- Production build validation
- Unit smoke tests (Vitest)
- Dependency health (`npm outdated`)
- Security advisories (`npm audit`)

**Usage**:
```bash
npm run quality:audit
npm run quality:audit -- --report artifacts/custom-report.json
npm run quality:audit -- --ci --offline-sample
```

See `docs/runbooks/quality-audit.md` for detailed usage and troubleshooting.

## Adding New Scripts

1. Create a `.ts` file in this directory
2. Add the corresponding npm script entry in `package.json`
3. Document the script's purpose and usage in this README
4. Follow the error code and logging conventions above
