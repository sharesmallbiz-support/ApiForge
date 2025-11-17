import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import type { QualityAuditRun, DependencyAdvisory } from '../../shared/schema.ts';

/**
 * Report generator: serializes audit run results to JSON
 * 
 * Produces a machine-readable artifact conforming to the quality-audit-report schema
 * for consumption by CI systems, dashboards, and PR automation.
 */

interface ReportOutput {
  version: string;
  timestamp: string;
  summary: {
    status: 'passed' | 'failed';
    durationMs: number;
    failedSteps: number;
    skippedSteps: number;
    artifacts: Array<{ name: string; path: string; type: 'file' }>;
  };
  steps: Array<{
    id: string;
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    durationMs: number;
    details?: Record<string, unknown>;
    errors?: Array<{ message: string; code?: string }>;
  }>;
}

export function generateReport(
  auditRun: QualityAuditRun,
  checklist: { steps: Array<{ id: string; label: string }> }
): ReportOutput {
  const startTime = new Date(auditRun.startedAt).getTime();
  const endTime = new Date(auditRun.finishedAt).getTime();
  const durationMs = endTime - startTime;

  const failedSteps = auditRun.steps.filter(s => s.status === 'failed').length;
  const skippedSteps = auditRun.steps.filter(s => s.status === 'skipped').length;

  const steps = auditRun.steps.map(result => {
    const step = checklist.steps.find(s => s.id === result.stepId);
    const stepStartTime = new Date(result.startedAt).getTime();
    const stepEndTime = new Date(result.finishedAt).getTime();
    const stepDurationMs = stepEndTime - stepStartTime;

    const errors = result.status === 'failed' && result.stderr
      ? [{ message: result.stderr.slice(0, 500) }]
      : undefined;

    return {
      id: result.stepId,
      name: step?.label || result.stepId,
      status: result.status,
      durationMs: stepDurationMs,
      details: result.exitCode !== null ? { exitCode: result.exitCode } : undefined,
      errors,
    };
  });

  return {
    version: 'v1.0.0',
    timestamp: auditRun.finishedAt,
    summary: {
      status: auditRun.status,
      durationMs,
      failedSteps,
      skippedSteps,
      artifacts: [{ name: 'audit-report', path: auditRun.reportPath, type: 'file' }],
    },
    steps,
  };
}

export function writeReport(report: ReportOutput, path: string): void {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`[report] Written to ${path}`);
  } catch (error) {
    console.error('[report] Failed to write report:', error);
    throw error;
  }
}

export function parseDependencyAdvisories(
  outdatedOutput: string,
  auditOutput: string
): DependencyAdvisory[] {
  const advisories: DependencyAdvisory[] = [];

  // Parse npm outdated --json
  try {
    if (outdatedOutput && outdatedOutput.trim()) {
      const outdated = JSON.parse(outdatedOutput);
      for (const [pkg, info] of Object.entries(outdated as Record<string, any>)) {
        advisories.push({
          package: pkg,
          currentVersion: info.current || 'unknown',
          latestVersion: info.latest || 'unknown',
          severity: 'info',
          type: 'outdated',
        });
      }
    }
  } catch (error) {
    console.error('[report] Failed to parse npm outdated output:', error);
  }

  // Parse npm audit --json
  try {
    if (auditOutput && auditOutput.trim()) {
      const audit = JSON.parse(auditOutput);
      if (audit.vulnerabilities) {
        for (const [pkg, vuln] of Object.entries(audit.vulnerabilities as Record<string, any>)) {
          advisories.push({
            package: pkg,
            currentVersion: vuln.range || 'unknown',
            latestVersion: vuln.fixAvailable?.version || 'unknown',
            severity: (vuln.severity || 'info') as any,
            type: 'vulnerability',
            advisoryUrl: vuln.via?.[0]?.url,
          });
        }
      }
    }
  } catch (error) {
    console.error('[report] Failed to parse npm audit output:', error);
  }

  return advisories;
}
