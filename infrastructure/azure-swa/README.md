# Azure Static Web Apps - Infrastructure Guide

## Overview

This directory contains configuration and documentation for deploying ApiForge as an Azure Static Web App (SWA).

## Resource Topology

```
Azure Static Web App (Standard SKU)
├── Preview Slot (ephemeral per PR)
│   ├── Static Assets (Vite build output)
│   ├── Azure Functions (Node 18 runtime)
│   └── Application Settings (preview secrets)
└── Production Slot (main branch)
    ├── Static Assets (Vite build output)
    ├── Azure Functions (Node 18 runtime)
    └── Application Settings (production secrets)
```

## Prerequisites

### Required Tools

- **Node.js**: 18 LTS (matching Azure Functions runtime)
- **npm**: 10.x or higher
- **Azure CLI**: 2.50.0 or higher
  ```bash
  az --version
  az upgrade
  ```
- **Azure Functions Core Tools**: v4.x
  ```bash
  npm install -g azure-functions-core-tools@4 --unsafe-perm true
  ```
- **Azure Static Web Apps CLI**: Latest
  ```bash
  npm install -g @azure/static-web-apps-cli
  ```

### Azure Subscription Requirements

- Permissions to create Static Web Apps resources
- Permissions to create Application Insights instances
- GitHub account with repository access for Actions integration

## Provisioning

### 1. Create Static Web App Resource

Using Azure CLI:

```bash
az staticwebapp create \
  --name apiforge-prod \
  --resource-group apiforge-rg \
  --source https://github.com/sharesmallbiz-support/ApiForge \
  --branch main \
  --location eastus2 \
  --login-with-github
```

For preview environments:
```bash
az staticwebapp create \
  --name apiforge-preview \
  --resource-group apiforge-rg \
  --source https://github.com/sharesmallbiz-support/ApiForge \
  --branch 001-azure-static-app \
  --location eastus2 \
  --login-with-github
```

### 2. Retrieve Deployment Token

```bash
az staticwebapp secrets list \
  --name apiforge-prod \
  --resource-group apiforge-rg \
  --query "properties.apiKey" -o tsv
```

Save this token as `AZURE_STATIC_WEB_APPS_API_TOKEN` in GitHub repository secrets.

### 3. Configure Application Insights

```bash
az monitor app-insights component create \
  --app apiforge-insights \
  --location eastus2 \
  --resource-group apiforge-rg
```

Retrieve connection string:
```bash
az monitor app-insights component show \
  --app apiforge-insights \
  --resource-group apiforge-rg \
  --query "connectionString" -o tsv
```

## Configuration Files

- `staticwebapp.config.json` - SWA routing, headers, and fallback rules
- `staticwebapp.config.template.json` - Template for environment-specific overrides
- `parameters.example.json` - Example resource parameters for IaC deployment
- `alerts.bicep` - Azure Monitor alert rules for observability

## Application Settings

Application settings are managed per slot (preview/production) via:

```bash
az staticwebapp appsettings set \
  --name apiforge-prod \
  --resource-group apiforge-rg \
  --setting-names \
    APPINSIGHTS_CONNECTIONSTRING="<connection-string>" \
    EXECUTOR_API_KEY="<secret-value>"
```

### Key Vault References (Optional)

For enhanced secret management:

```bash
az staticwebapp appsettings set \
  --name apiforge-prod \
  --resource-group apiforge-rg \
  --setting-names \
    EXECUTOR_API_KEY="@Microsoft.KeyVault(SecretUri=https://vault.vault.azure.net/secrets/executor-key/)"
```

## Deployment Tokens

GitHub Actions requires the SWA deployment token stored as a repository secret:

1. Navigate to repository Settings > Secrets and variables > Actions
2. Add `AZURE_STATIC_WEB_APPS_API_TOKEN` with value from step 2 above
3. Repeat for each environment if using multiple SWA resources

## Local Development

Test SWA routing and Functions integration locally:

```bash
# Build client
npm run build

# Start SWA CLI with Functions
swa start dist --api-location api --run "npm run dev:functions"
```

Access at `http://localhost:4280`

## Deployment Workflow

Deployments are automated via `.github/workflows/azure-static-web-app.yml`:

- **Preview**: Triggered on pull requests targeting `main`
- **Production**: Triggered on pushes to `main` branch

Manual deployment via CLI:

```bash
swa deploy \
  --app-location client \
  --api-location api \
  --output-location dist \
  --deployment-token $AZURE_STATIC_WEB_APPS_API_TOKEN
```

## Monitoring & Observability

Application Insights automatically instruments:
- HTTP request traces
- Dependency calls
- Custom telemetry from Functions

Access dashboards:
```bash
az portal open \
  --resource-group apiforge-rg \
  --resource-type Microsoft.Insights/components \
  --resource-name apiforge-insights
```

See `docs/runbooks/quality-audit.md` for alert thresholds and SLOs.

## Troubleshooting

### Build Failures

Check GitHub Actions logs:
```bash
gh run list --workflow=azure-static-web-app.yml
gh run view <run-id> --log
```

### Runtime Errors

Query Application Insights:
```bash
az monitor app-insights query \
  --app apiforge-insights \
  --resource-group apiforge-rg \
  --analytics-query "traces | where severityLevel >= 3 | take 50"
```

### Cold Start Issues

Review Functions host logs and consider:
- Increasing timeout settings in `host.json`
- Implementing warmup functions
- Upgrading to Premium Functions plan (if needed)

## Cost Optimization

- Standard SWA plan: ~$9/month + bandwidth
- Free tier Functions: 1M executions/month included
- Application Insights: Pay-as-you-go (first 5GB/month free)

Monitor costs:
```bash
az costmanagement query \
  --type Usage \
  --timeframe MonthToDate \
  --dataset-filter "{\"ResourceGroup\":{\"Name\":\"equals\",\"Values\":[\"apiforge-rg\"]}}"
```

## References

- [Azure Static Web Apps Documentation](https://learn.microsoft.com/azure/static-web-apps/)
- [Azure Functions Node.js Guide](https://learn.microsoft.com/azure/azure-functions/functions-reference-node)
- [SWA CLI Repository](https://github.com/Azure/static-web-apps-cli)
