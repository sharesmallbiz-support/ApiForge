# 🚀 Azure Static Web App - Deployment Readiness Checklist

## Pre-Deployment

### ✅ Infrastructure Setup
- [ ] Azure subscription active and accessible
- [ ] Resource group created (`apiforge-rg` or equivalent)
- [ ] Application Insights instance provisioned
- [ ] Static Web App resource created
- [ ] Deployment token retrieved and stored as GitHub secret

### ✅ Repository Configuration
- [ ] GitHub Actions enabled
- [ ] Required secrets configured:
  - [ ] `AZURE_STATIC_WEB_APPS_API_TOKEN` (preview)
  - [ ] `AZURE_STATIC_WEB_APPS_API_TOKEN_PROD` (production)
- [ ] Branch protection rules enabled on `main`

### ✅ Code Quality
- [ ] All linting issues resolved (`npm run lint`)
- [ ] Type checking passes (`npm run check`)
- [ ] All tests passing (`npm run test`)
- [ ] Quality audit completed (`npm run quality:audit`)

### ✅ Dependencies
- [ ] Root dependencies installed (`npm install`)
- [ ] API dependencies installed (`cd api && npm install`)
- [ ] SWA CLI installed globally or in devDependencies
- [ ] Azure Functions Core Tools v4 installed

## Deployment Validation

### ✅ Local Testing
- [ ] Client builds successfully (`npm run build`)
- [ ] Functions build successfully (`cd api && npm run build`)
- [ ] SWA CLI test passed (`npm run swa:start`)
- [ ] Sample request executes successfully via Functions

### ✅ GitHub Actions Workflow
- [ ] Workflow file syntax valid (`.github/workflows/azure-static-web-app.yml`)
- [ ] Build-test job configured correctly
- [ ] Preview deployment job configured
- [ ] Production deployment job configured
- [ ] Artifact upload/download working

### ✅ Static Web App Configuration
- [ ] `staticwebapp.config.json` present in repo root or `infrastructure/azure-swa/`
- [ ] API routes configured (`/api/*`)
- [ ] SPA fallback routing configured
- [ ] Security headers defined
- [ ] MIME types configured

## Post-Deployment

### ✅ Preview Environment
- [ ] PR triggers preview deployment
- [ ] Preview URL accessible
- [ ] Static assets load correctly
- [ ] API endpoints respond (`/api/requests/test/execute`)
- [ ] Request execution completes successfully
- [ ] Application Insights receiving telemetry

### ✅ Production Environment
- [ ] Merge to `main` triggers production deployment
- [ ] Production URL accessible
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate valid
- [ ] API endpoints respond
- [ ] Request execution completes successfully

### ✅ Observability
- [ ] Application Insights dashboard accessible
- [ ] Telemetry flowing (traces, metrics, logs)
- [ ] Alert rules deployed (`alerts.bicep`)
- [ ] Action groups configured for notifications
- [ ] Cold start metrics tracked

### ✅ Operations
- [ ] Runbooks reviewed and accessible
- [ ] Operations log initialized
- [ ] Rollback procedure tested (dry run)
- [ ] Secret rotation schedule documented
- [ ] On-call rotation established (if applicable)

## Success Criteria Validation

### ✅ SC-001: Deployment Duration
- [ ] GitHub Actions workflow completes in <5 minutes
- [ ] Deployment metrics captured in artifacts
- [ ] Evidence documented in quality audit report

### ✅ SC-002: P95 Latency
- [ ] Load test executed (Playwright/Artillery)
- [ ] P95 latency measured and <2 seconds
- [ ] Results documented in `docs/runbooks/quality-audit.md`

### ✅ SC-003: Beta Success Rate
- [ ] Beta feedback issue template published
- [ ] Feedback collection mechanism active
- [ ] Tracking spreadsheet/dashboard created
- [ ] Target: ≥90% success rate

### ✅ SC-004: Incident Rate
- [ ] Operations log template created
- [ ] Incident tracking process documented
- [ ] Monthly review schedule established
- [ ] Target: <2 incidents per month

## Documentation Review

### ✅ User Documentation
- [ ] README updated with Azure deployment instructions
- [ ] Quickstart guide complete (`specs/001-azure-static-app/quickstart.md`)
- [ ] Execution modes comparison documented
- [ ] Troubleshooting guide available

### ✅ Operations Documentation
- [ ] Infrastructure README complete (`infrastructure/azure-swa/README.md`)
- [ ] Rollback runbook complete (`docs/runbooks/rollback.md`)
- [ ] Quality audit runbook updated (`docs/runbooks/quality-audit.md`)
- [ ] Operations log initialized (`docs/runbooks/operations-log.md`)

### ✅ Developer Documentation
- [ ] API contracts documented (`contracts/hosted-execution.openapi.yaml`)
- [ ] Schema changes documented in `shared/schema.ts`
- [ ] Functions implementation documented
- [ ] Environment variable reference complete

## Go/No-Go Decision

### Go Criteria (All Must Pass)
- ✅ All code quality checks passing
- ✅ Local SWA testing successful
- ✅ Preview deployment functional
- ✅ Observability configured
- ✅ Rollback procedure tested

### No-Go Indicators (Any Blocks Deployment)
- ❌ Quality audit failures
- ❌ Preview deployment errors
- ❌ Missing observability
- ❌ Incomplete runbooks
- ❌ No rollback procedure

## Deployment Approval

**Approved by**: _________________  
**Date**: _________________  
**Notes**: _________________

---

## Post-Deployment Monitoring (First 48 Hours)

- [ ] Hour 1: Check Application Insights for errors
- [ ] Hour 6: Review latency metrics
- [ ] Hour 12: Verify cold start frequency
- [ ] Hour 24: Review incident log (should be empty)
- [ ] Hour 48: Collect initial beta feedback

## Related Documentation

- [Infrastructure README](../infrastructure/azure-swa/README.md)
- [Quickstart Guide](../specs/001-azure-static-app/quickstart.md)
- [Rollback Runbook](./rollback.md)
- [Quality Audit Runbook](./quality-audit.md)
