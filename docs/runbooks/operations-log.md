# Operations Log

## Purpose

This log tracks operational events, incidents, and deployments for the ApiForge Azure Static Web App. Use this to maintain a record for SC-004 compliance (targeting <2 hosted incidents per month).

## Log Format

Each entry should include:
- **Date**: ISO 8601 format (YYYY-MM-DD)
- **Type**: Deployment | Incident | Maintenance | Configuration
- **Severity**: Info | Warning | Critical
- **Description**: Brief summary
- **Resolution**: Actions taken (for incidents)
- **Duration**: Downtime or impact duration (for incidents)

---

## 2025

### November

#### 2025-11-20 | Deployment | Info
**Description**: Initial Azure Static Web App infrastructure setup  
**Details**: Created SWA resource, GitHub Actions workflow, and Functions backend  
**Commit**: [SHA to be added]

---

## Incident Tracking

### Monthly Summary

| Month | Total Incidents | Critical | Downtime | Target Met |
|-------|----------------|----------|----------|------------|
| Nov 2025 | 0 | 0 | 0min | ✅ Yes |

---

## Maintenance Windows

### Planned Maintenance

| Date | Duration | Reason | Impact |
|------|----------|--------|--------|
| TBD | TBD | TBD | TBD |

---

## Configuration Changes

### Application Settings Updates

| Date | Setting | Old Value | New Value | Reason |
|------|---------|-----------|-----------|--------|
| 2025-11-20 | APPINSIGHTS_CONNECTIONSTRING | - | [redacted] | Initial setup |

---

## Deployment History

### Production Deployments

| Date | Commit SHA | Features | Status |
|------|-----------|----------|--------|
| 2025-11-20 | [pending] | Initial SWA deployment | Pending |

### Preview Deployments

| Date | PR# | Commit SHA | Status |
|------|-----|-----------|--------|
| TBD | TBD | TBD | TBD |

---

## Notes

- Incident severity levels follow standard definitions:
  - **Info**: Normal operations, successful deployments
  - **Warning**: Degraded performance, non-critical errors
  - **Critical**: Service outage, data loss risk, security breach
  
- SC-004 target: <2 hosted incidents per month (Warning + Critical combined)
- Log entries should be added within 24 hours of the event
- Monthly summaries updated on the 1st of each month
