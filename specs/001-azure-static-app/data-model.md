# Data Model — Azure Static Web App Conversion

**Date**: 2025-11-20  
**Scope**: Entities introduced or impacted while hosting ApiForge on Azure Static Web Apps.

## DeploymentEnvironment
- **Description**: Represents a routed Static Web App slot (preview or production) plus its runtime configuration.
- **Fields**:
  - `id` (string, e.g., `preview`, `production`)
  - `swaResourceId` (string Azure resource ID)
  - `staticAssetSource` (path to built client artifact)
  - `functionsPackage` (path/hash for zipped Functions app)
  - `customDomains` (array of hostnames)
  - `status` (enum: `Provisioning`, `Ready`, `Failed`, `Degraded`)
  - `lastDeployedSha` (git SHA)
  - `lastPromotedAt` (ISO timestamp)
- **Relationships**: Owns zero or more `SecretBinding` entries; feeds telemetry into `TelemetrySignal`.
- **State Transitions**:
  - `Provisioning → Ready` when SWA deployment completes.
  - `Ready → Degraded` when health probes fail or alert thresholds trigger.
  - `Ready/Degraded → Failed` when deployment or certificate validation fails.
  - `Degraded → Ready` after remediation + re-deploy.

## SecretBinding
- **Description**: Mapping between logical secret names used by ApiForge executors and Azure storage for each environment slot.
- **Fields**:
  - `name` (string, e.g., `EXECUTOR_API_KEY`)
  - `slot` (string: `preview` | `production`)
  - `provider` (enum: `SWASetting`, `KeyVaultReference`)
  - `version` (string; Key Vault secret version or SWA revision)
  - `expiresOn` (ISO timestamp, optional)
  - `required` (boolean)
- **Relationships**: Attached to exactly one `DeploymentEnvironment`.
- **Validation Rules**:
  - Required secrets must have non-empty values before deployment proceeds.
  - Preview and production slots may resolve to different providers but must share logical names for code reuse.

## FunctionApp
- **Description**: Package of Azure Functions hosting request execution logic.
- **Fields**:
  - `name` (string)
  - `runtime` (enum: `node18`)
  - `entryPoints` (array of functions such as `executeRequest`, `fetchHistory`)
  - `bindings` (array describing HTTP triggers, auth level anonymous, route templates)
  - `dependenciesHash` (hash of `package-lock.json`)
  - `telemetryKey` (Application Insights connection string)
- **Relationships**: Deployed alongside each `DeploymentEnvironment`; consumes `SecretBinding` values to reach downstream APIs.
- **State Transitions**:
  - `Draft → Bundled` when zipped for SWA artifact.
  - `Bundled → Active` after deployment with matching secrets.
  - `Active → Deprecated` once replaced by a newer bundle; remains available for rollback.

## TelemetrySignal
- **Description**: Aggregated metrics/alerts that describe health of hosted execution.
- **Fields**:
  - `signalId` (string, e.g., `request-latency-P95`)
  - `source` (enum: `ApplicationInsights`, `AzureMonitor`)
  - `targetThreshold` (numeric or expression)
  - `currentValue` (number)
  - `alertState` (enum: `Healthy`, `Warning`, `Critical`)
  - `lastUpdated` (timestamp)
  - `notificationHooks` (array of webhook or email endpoints)
- **Relationships**: Linked to one `DeploymentEnvironment`.
- **Rules**:
  - Alerts must track both latency and error-rate metrics as mandated by spec.
  - Signals should be queryable for release evidence and runbooks.

## ExecutionRequest (impacted entity)
- **Description**: Existing request document stored locally; needs metadata to distinguish local vs hosted execution.
- **New/Changed Fields**:
  - `lastHostedRun` (timestamp, optional)
  - `hostedRunResult` (enum: `Success`, `Failure`, `Timeout`)
  - `hostedRunUrl` (string; link to Azure Monitor trace)
- **Validation Rules**:
  - Hosted metadata must only populate when Azure Functions executes the request; offline runs keep current schema untouched.
  - Clients must gracefully ignore hosted metadata when offline.
