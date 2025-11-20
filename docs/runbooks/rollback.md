# Rollback and Recovery Runbook

## Overview

This runbook provides procedures for rolling back Azure Static Web App deployments, recovering from incidents, and promoting builds between environments.

## Table of Contents

1. [Quick Rollback](#quick-rollback)
2. [Build Promotion](#build-promotion)
3. [Incident Response](#incident-response)
4. [Data Recovery](#data-recovery)
5. [Environment Reset](#environment-reset)

---

## Quick Rollback

### Scenario: Production deployment is broken

**Symptoms:**
- 5xx errors in Application Insights
- Client cannot load or execute requests
- Breaking changes deployed to production

**Immediate Action:**

1. **Identify Last Good Commit**
   ```bash
   # View recent production deployments
   gh run list --workflow=azure-static-web-app.yml --branch=main --limit=5
   
   # Get details of last successful run
   gh run view <run-id>
   ```

2. **Trigger Rollback Deployment**
   ```bash
   # Re-run the last successful workflow
   gh run rerun <last-good-run-id>
   
   # OR manually redeploy from specific commit
   git checkout <last-good-commit-sha>
   git push origin HEAD:main --force
   ```

3. **Verify Rollback**
   ```bash
   # Check deployment status
   az staticwebapp show \
     --name apiforge-prod \
     --resource-group apiforge-rg \
     --query "defaultHostname" -o tsv
   
   # Test execution endpoint
   curl https://<hostname>/api/requests/test/execute \
     -X POST -H "Content-Type: application/json" \
     -d '{"workspaceId":"test","resolvedRequest":{"url":"https://httpbin.org/get","method":"GET"}}'
   ```

**Expected Duration:** 3-5 minutes

---

## Build Promotion

### Scenario: Promote preview to production

**Pre-flight Checks:**

1. **Validate Preview Build**
   ```bash
   # Get preview URL from PR
   PR_NUMBER=<pr-number>
   PREVIEW_URL=$(gh pr view $PR_NUMBER --json url -q '.url' | sed 's/github.com/preview.azurestaticapps.net/')
   
   # Run smoke tests
   npm run test:integration -- --base-url=$PREVIEW_URL
   ```

2. **Check for Breaking Changes**
   - Review PR diff for schema changes
   - Verify localStorage migration logic
   - Confirm backward compatibility with existing data

3. **Verify Metrics**
   - P95 latency < 2s in Application Insights
   - Error rate < 1%
   - No critical alerts firing

**Promotion Steps:**

1. **Merge Pull Request**
   ```bash
   gh pr merge <pr-number> --squash --delete-branch
   ```

2. **Monitor Production Deployment**
   ```bash
   # Watch workflow progress
   gh run watch
   
   # View deployment logs
   gh run view --log
   ```

3. **Validate Production**
   ```bash
   # Test production endpoint
   PROD_URL="https://apiforge-prod.azurestaticapps.net"
   curl $PROD_URL/api/requests/test/execute -X POST \
     -H "Content-Type: application/json" \
     -d '{"workspaceId":"prod-test","resolvedRequest":{"url":"https://httpbin.org/status/200","method":"GET"}}'
   
   # Check Application Insights for errors
   az monitor app-insights query \
     --app apiforge-insights \
     --resource-group apiforge-rg \
     --analytics-query "traces | where severityLevel >= 3 | where timestamp > ago(5m)"
   ```

4. **Document Promotion**
   ```bash
   # Record in ops log
   echo "$(date -u +%Y-%m-%d): Promoted build $(git rev-parse HEAD) to production" >> docs/runbooks/operations-log.md
   ```

**Rollback Window:** 15 minutes after promotion

---

## Incident Response

### Critical Incident Workflow

1. **Assess Impact**
   - Check Application Insights dashboard
   - Review error rates and affected users
   - Determine if rollback is needed

2. **Communicate**
   ```bash
   # Post to status channel
   echo "INCIDENT: ApiForge production degraded. Investigating..." | teams-notify
   ```

3. **Gather Evidence**
   ```bash
   # Export recent logs
   az monitor app-insights query \
     --app apiforge-insights \
     --resource-group apiforge-rg \
     --analytics-query "traces | where timestamp > ago(30m)" \
     --output json > incident-logs.json
   
   # Capture metrics
   az monitor app-insights metrics show \
     --app apiforge-insights \
     --resource-group apiforge-rg \
     --metric requests/duration \
     --interval PT1M \
     --output json > incident-metrics.json
   ```

4. **Execute Mitigation**
   - If Functions issue: Restart Functions host
   - If client issue: Rollback deployment
   - If external dependency: Enable circuit breaker

5. **Post-Incident**
   - Document in `docs/runbooks/operations-log.md`
   - Update incident counter for SC-004 tracking
   - Schedule postmortem review

---

## Data Recovery

### User Lost Data

**Issue:** User cleared browser storage

**Solution:**

1. **Export from Another Browser/Device**
   - If user has ApiForge open elsewhere, export data via Settings → Export

2. **Recover from Backup**
   - If user previously exported, import the JSON file

3. **Recreate from History**
   - Request execution history stored in localStorage can be re-imported

**Prevention:**
- Encourage users to export regularly
- Add browser extension for automatic backups
- Document export procedure in Getting Started guide

### Workspace Corruption

**Issue:** localStorage data is corrupted or invalid

**Solution:**

```javascript
// Open browser console on ApiForge page
// Clear corrupted data
localStorage.removeItem('apiforge-workspaces');
localStorage.removeItem('apiforge-collections');
localStorage.removeItem('apiforge-requests');

// Reload page to reinitialize
location.reload();

// Load sample data
// Click "Load Sample Collection" in UI
```

---

## Environment Reset

### Reset Preview Environment

```bash
# Delete preview deployment
az staticwebapp environment delete \
  --name apiforge-preview \
  --resource-group apiforge-rg \
  --environment-name <pr-number>

# PR re-open will trigger new deployment
```

### Reset Production Environment

**⚠️ CAUTION: Production reset will cause downtime**

```bash
# 1. Notify users of maintenance window

# 2. Export current settings
az staticwebapp appsettings list \
  --name apiforge-prod \
  --resource-group apiforge-rg \
  --output json > prod-settings-backup.json

# 3. Delete and recreate resource
az staticwebapp delete \
  --name apiforge-prod \
  --resource-group apiforge-rg \
  --yes

az staticwebapp create \
  --name apiforge-prod \
  --resource-group apiforge-rg \
  --source https://github.com/sharesmallbiz-support/ApiForge \
  --branch main \
  --location eastus2 \
  --login-with-github

# 4. Restore settings
cat prod-settings-backup.json | jq -r '.properties | to_entries[] | "\(.key)=\(.value)"' | \
  xargs az staticwebapp appsettings set \
    --name apiforge-prod \
    --resource-group apiforge-rg \
    --setting-names

# 5. Trigger new deployment
git commit --allow-empty -m "Redeploy after environment reset"
git push origin main
```

---

## Monitoring Queries

### Check Recent Errors

```bash
az monitor app-insights query \
  --app apiforge-insights \
  --resource-group apiforge-rg \
  --analytics-query "exceptions | where timestamp > ago(1h) | summarize count() by problemId, outerMessage"
```

### Request Latency Distribution

```bash
az monitor app-insights query \
  --app apiforge-insights \
  --resource-group apiforge-rg \
  --analytics-query "requests | where timestamp > ago(1h) | summarize percentiles(duration, 50, 95, 99) by name"
```

### Cold Start Frequency

```bash
az monitor app-insights query \
  --app apiforge-insights \
  --resource-group apiforge-rg \
  --analytics-query "traces | where message contains 'cold start' | summarize count() by bin(timestamp, 1h)"
```

---

## Contact Information

- **On-Call Engineer:** [PagerDuty rotation]
- **Azure Support:** [Support ticket portal]
- **GitHub Issues:** https://github.com/sharesmallbiz-support/ApiForge/issues

## Related Documentation

- [Quality Audit Runbook](quality-audit.md)
- [Infrastructure README](../../infrastructure/azure-swa/README.md)
- [Quickstart Guide](../../specs/001-azure-static-app/quickstart.md)
