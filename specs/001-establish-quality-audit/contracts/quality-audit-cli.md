# Contract: Quality Audit CLI

## Command

```bash
npm run quality:audit [-- --report <path> --ci]
```

### Arguments
-
- `--report <path>` (optional): override default artifact location (`artifacts/quality-audit-report.json`).
- `--ci` (optional flag): suppress interactive prompts, force JSON-only output, and exit on first failure when `true`.

### Environment Variables
-
- `APIFORGE_AUDIT_LOG_LEVEL`: `info` (default), `debug`, or `silent`.
- `APIFORGE_SKIP_AUTO_INSTALL`: when set to `1`, bypasses the automatic `npm ci` step even if `node_modules` is missing (intended for cached CI steps that manage installs externally).
- `GITHUB_OUTPUT`: respected when running inside GitHub Actions to publish summary metadata.

### Exit Codes
-
- `0`: All required audit steps completed successfully.
- `1`: One or more required audit steps failed.
- `2`: CLI misconfiguration (e.g., checklist missing required category, invalid flag combination).

### Side Effects
-
- Writes or updates the report JSON file (default `artifacts/quality-audit-report.json`).
- Emits human-readable summary to stdout; detailed logs per step streamed to stdout/stderr.
- On auto-install, runs `npm ci` once per invocation when `node_modules` is absent.

### Step Execution Order
- `lint` → `type` (`tsc --noEmit`) → `build` (`npm run build`) → `test` (`vitest --run --reporter=junit,json` limited smoke suite) → `dependency` (`npm outdated --json`) → `security` (`npm audit --json`).
- Optional steps (future) execute after the required baseline unless explicitly inserted via checklist versioning.

### Failure Handling
-
- Failing steps mark subsequent required steps as `skipped` only when `--ci` is passed (fail-fast); local runs continue through all steps to surface all issues.
- Summary always lists failing steps with recommended remediation commands.
