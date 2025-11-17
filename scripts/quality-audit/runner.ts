import { execa } from 'execa';
import type { 
  QualityAuditChecklist, 
  QualityAuditResult, 
  AuditStepStatus,
  DependencyAdvisory
} from '../../shared/schema.ts';
import { parseDependencyAdvisories } from './report-writer.ts';

const LOG_LEVEL = process.env.APIFORGE_AUDIT_LOG_LEVEL || 'info';

function log(level: 'info' | 'debug' | 'silent', message: string) {
  const levels = { silent: 0, info: 1, debug: 2 };
  if (levels[LOG_LEVEL as keyof typeof levels] >= levels[level]) {
    console.log(message);
  }
}

interface RunnerOptions {
  projectRoot: string;
  ciMode: boolean;
  maxRetries?: number;
}

interface RunnerOutput {
  results: QualityAuditResult[];
  dependencies?: DependencyAdvisory[];
}

/**
 * Sequential runner: executes audit steps in order
 * 
 * Features:
 * - Captures status, timing, exit codes, stdout/stderr for each step
 * - Retries registry-dependent steps (npm outdated, npm audit) before marking skipped
 * - Parses npm outdated/audit output into dependency advisories
 * - In CI mode (--ci flag), stops on first failure (fail-fast)
 * - In local mode, continues through all steps to surface all issues
 */
export async function runAuditSteps(
  checklist: QualityAuditChecklist,
  options: RunnerOptions
): Promise<RunnerOutput> {
  const results: QualityAuditResult[] = [];
  const { projectRoot, ciMode, maxRetries = 2 } = options;
  let failedRequired = false;
  let outdatedOutput = '';
  let auditOutput = '';

  for (const step of checklist.steps) {
    // Skip remaining required steps in CI mode if a previous required step failed
    if (ciMode && failedRequired && step.required) {
      log('info', `[${step.id}] Skipped (fail-fast in CI mode)`);
      results.push({
        stepId: step.id,
        status: 'skipped',
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        exitCode: null,
        notes: 'Skipped due to previous failure in CI mode',
      });
      continue;
    }

    log('info', `[${step.id}] Running: ${step.label}`);
    const startedAt = new Date().toISOString();

    let status: AuditStepStatus = 'passed';
    let exitCode: number | null = 0;
    let stdout = '';
    let stderr = '';
    let notes = '';

    // Registry-dependent steps get retry logic
    const isRegistryStep = step.category === 'dependency' || step.category === 'security';
    const retries = isRegistryStep ? maxRetries : 0;

    let attempt = 0;
    let success = false;

    while (attempt <= retries && !success) {
      try {
        const [command, ...args] = step.command.split(' ');
        const result = await execa(command, args, {
          cwd: projectRoot,
          reject: false,
          timeout: 300000, // 5 minute timeout
        });

        exitCode = result.exitCode;
        stdout = result.stdout.slice(0, 5000); // Truncate to 5KB
        stderr = result.stderr.slice(0, 5000);

        // Capture dependency outputs for parsing
        if (step.id === 'outdated') {
          outdatedOutput = result.stdout;
        } else if (step.id === 'audit') {
          auditOutput = result.stdout;
        }

        if (exitCode === 0) {
          status = 'passed';
          success = true;
          log('debug', `[${step.id}] Completed with exit code 0`);
        } else {
          status = 'failed';
          if (attempt < retries) {
            log('info', `[${step.id}] Failed (attempt ${attempt + 1}/${retries + 1}), retrying...`);
            attempt++;
            // Wait 2 seconds before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            log('info', `[${step.id}] Failed with exit code ${exitCode}`);
            notes = step.description;
            if (step.required) {
              failedRequired = true;
            }
            success = true; // Exit retry loop
          }
        }
      } catch (error: unknown) {
        // Network errors or timeouts
        if (attempt < retries) {
          log('info', `[${step.id}] Error (attempt ${attempt + 1}/${retries + 1}), retrying...`);
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          status = 'skipped';
          exitCode = null;
          stderr = error instanceof Error ? error.message : 'Unknown error';
          notes = isRegistryStep 
            ? 'Network unavailable - re-run with connectivity to complete security checks'
            : step.description;
          log('info', `[${step.id}] Skipped due to error: ${stderr.slice(0, 100)}`);
          
          // Treat skipped security steps as failures in CI mode
          if (ciMode && step.category === 'security') {
            status = 'failed';
            failedRequired = true;
          }
          success = true;
        }
      }
    }

    const finishedAt = new Date().toISOString();
    results.push({
      stepId: step.id,
      status,
      startedAt,
      finishedAt,
      exitCode,
      stdout,
      stderr,
      notes,
    });
  }

  // Parse dependency advisories from outputs
  const dependencies = parseDependencyAdvisories(outdatedOutput, auditOutput);

  return { results, dependencies };
}
