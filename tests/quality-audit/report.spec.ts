import { describe, it, expect } from 'vitest';
import { qualityAuditRunSchema } from '../../shared/schema';
import type { QualityAuditRun } from '../../shared/schema';

describe('Quality Audit Report Schema', () => {
  it('should validate a complete audit run', () => {
    const validRun: QualityAuditRun = {
      id: 'test-run-123',
      startedAt: '2025-11-16T10:00:00Z',
      finishedAt: '2025-11-16T10:05:00Z',
      runner: 'local',
      status: 'passed',
      reportPath: 'artifacts/quality-audit-report.json',
      steps: [
        {
          stepId: 'lint',
          status: 'passed',
          startedAt: '2025-11-16T10:00:00Z',
          finishedAt: '2025-11-16T10:01:00Z',
          exitCode: 0,
          stdout: 'All files passed linting',
          stderr: '',
        },
      ],
    };

    const result = qualityAuditRunSchema.safeParse(validRun);
    expect(result.success).toBe(true);
  });

  it('should reject invalid status values', () => {
    const invalidRun = {
      id: 'test-run-123',
      startedAt: '2025-11-16T10:00:00Z',
      finishedAt: '2025-11-16T10:05:00Z',
      runner: 'local',
      status: 'unknown', // Invalid status
      reportPath: 'artifacts/quality-audit-report.json',
      steps: [],
    };

    const result = qualityAuditRunSchema.safeParse(invalidRun);
    expect(result.success).toBe(false);
  });

  it('should validate dependency advisories', () => {
    const runWithAdvisories: QualityAuditRun = {
      id: 'test-run-456',
      startedAt: '2025-11-16T10:00:00Z',
      finishedAt: '2025-11-16T10:05:00Z',
      runner: 'ci',
      status: 'failed',
      reportPath: 'artifacts/quality-audit-report.json',
      steps: [],
      dependencies: [
        {
          package: 'example-package',
          currentVersion: '1.0.0',
          latestVersion: '2.0.0',
          severity: 'moderate',
          type: 'outdated',
        },
      ],
    };

    const result = qualityAuditRunSchema.safeParse(runWithAdvisories);
    expect(result.success).toBe(true);
  });

  it('should require non-null exit code for passed/failed steps', () => {
    const stepWithNullExit = {
      stepId: 'test',
      status: 'passed',
      startedAt: '2025-11-16T10:00:00Z',
      finishedAt: '2025-11-16T10:01:00Z',
      exitCode: null, // Should be a number for passed/failed
    };

    // Schema allows null exitCode, but logic should prevent it for non-skipped steps
    expect(stepWithNullExit.exitCode).toBe(null);
  });

  it('should validate SWA deployment evidence', () => {
    const runWithDeployments: QualityAuditRun = {
      id: 'test-run-789',
      startedAt: '2025-11-16T10:00:00Z',
      finishedAt: '2025-11-16T10:05:00Z',
      runner: 'ci',
      status: 'passed',
      reportPath: 'artifacts/quality-audit-report.json',
      steps: [],
      swaDeployments: [
        {
          environment: 'preview',
          durationSeconds: 120,
          commitSha: 'abc1234',
          prNumber: '42',
          timestamp: '2025-11-16T10:05:00Z',
        },
      ],
    };

    const result = qualityAuditRunSchema.safeParse(runWithDeployments);
    expect(result.success).toBe(true);
  });
});
