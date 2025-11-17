#!/usr/bin/env tsx

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';
import { ensureDependencies } from './quality-audit/auto-install.ts';
import { BASELINE_CHECKLIST } from './quality-audit/checklist.ts';
import { runAuditSteps } from './quality-audit/runner.ts';
import { verifyOfflineSample } from './quality-audit/offline-sample-check.ts';
import { generateReport, writeReport } from './quality-audit/report-writer.ts';
import type { QualityAuditRun } from '../shared/schema.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

interface CliArgs {
  report?: string;
  ci: boolean;
  offlineSample: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    ci: false,
    offlineSample: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--report' && i + 1 < args.length) {
      result.report = args[i + 1];
      i++;
    } else if (arg === '--ci') {
      result.ci = true;
    } else if (arg === '--offline-sample') {
      result.offlineSample = true;
    }
  }

  return result;
}

function printSummary(run: QualityAuditRun, ciMode: boolean) {
  console.log('\\n========================================');
  console.log('Quality Audit Summary');
  console.log('========================================');
  console.log(`Status: ${run.status === 'passed' ? '✓ PASSED' : '✗ FAILED'}`);
  console.log(`Duration: ${Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)}s`);
  console.log(`\\nStep Results:`);
  
  for (const result of run.steps) {
    const step = BASELINE_CHECKLIST.steps.find(s => s.id === result.stepId);
    const icon = result.status === 'passed' ? '✓' : result.status === 'failed' ? '✗' : '○';
    const duration = Math.round((new Date(result.finishedAt).getTime() - new Date(result.startedAt).getTime()) / 1000);
    console.log(`  ${icon} ${step?.label || result.stepId} (${duration}s)`);
    
    if (result.status === 'failed' && result.notes) {
      console.log(`    → ${result.notes}`);
    }
  }
  
  console.log(`\\nReport: ${run.reportPath}`);
  console.log('========================================\\n');
}

async function main() {
  const args = parseArgs();
  const reportPath = args.report || join(PROJECT_ROOT, 'artifacts', 'quality-audit-report.json');
  
  console.log('ApiForge Quality Audit');
  console.log('======================\\n');

  // Step 1: Auto-install dependencies if needed
  const depsReady = await ensureDependencies(PROJECT_ROOT);
  if (!depsReady) {
    console.error('✗ Dependency installation failed');
    process.exit(2);
  }

  // Step 2: Optional offline sample verification
  if (args.offlineSample) {
    const offlineOk = await verifyOfflineSample(PROJECT_ROOT);
    if (!offlineOk) {
      console.error('✗ Offline sample verification failed');
      process.exit(2);
    }
  }

  // Step 3: Run audit steps
  const startedAt = new Date().toISOString();
  const runnerOutput = await runAuditSteps(BASELINE_CHECKLIST, {
    projectRoot: PROJECT_ROOT,
    ciMode: args.ci,
  });
  const finishedAt = new Date().toISOString();

  // Step 4: Determine overall status
  const hasFailures = runnerOutput.results.some(r => r.status === 'failed');
  const status = hasFailures ? 'failed' : 'passed';

  // Step 5: Build audit run object
  const auditRun: QualityAuditRun = {
    id: randomUUID(),
    startedAt,
    finishedAt,
    runner: args.ci ? 'ci' : 'local',
    steps: runnerOutput.results,
    status,
    reportPath,
    dependencies: runnerOutput.dependencies,
  };

  // Step 6: Write JSON report
  const report = generateReport(auditRun, BASELINE_CHECKLIST);
  writeReport(report, reportPath);

  // Step 7: Print summary
  printSummary(auditRun, args.ci);

  // Step 8: Publish to GITHUB_OUTPUT if in CI
  if (args.ci && process.env.GITHUB_OUTPUT) {
    const fs = await import('fs');
    const failedCount = runnerOutput.results.filter(r => r.status === 'failed').length;
    const skippedCount = runnerOutput.results.filter(r => r.status === 'skipped').length;
    
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `audit-status=${status}\naudit-report=${reportPath}\naudit-failed=${failedCount}\naudit-skipped=${skippedCount}\n`
    );
    
    // Enforce failure for skipped security steps in CI mode
    if (args.ci && runnerOutput.results.some(r => r.stepId === 'audit' && r.status === 'skipped')) {
      console.error('✗ Security audit was skipped - this is not allowed in CI mode');
      process.exit(1);
    }
  }

  // Step 9: Exit with appropriate code
  if (status === 'failed') {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(2);
});
