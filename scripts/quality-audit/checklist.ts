import type { QualityAuditChecklist } from '../../shared/schema.ts';

/**
 * Baseline quality audit checklist v1.0.0
 * 
 * Defines the required steps for quality validation:
 * - lint: ESLint validation
 * - type: TypeScript type checking
 * - build: Production build verification
 * - test: Vitest smoke tests
 * - dependency: Outdated package detection
 * - security: Vulnerability scan
 */
export const BASELINE_CHECKLIST: QualityAuditChecklist = {
  version: '1.0.0',
  autoInstall: true,
  steps: [
    {
      id: 'lint',
      label: 'ESLint validation',
      command: 'npm run lint',
      category: 'lint',
      required: true,
      description: 'Run ESLint to check code quality and style compliance. Fix with: npm run lint:fix',
    },
    {
      id: 'typecheck',
      label: 'TypeScript type checking',
      command: 'npm run check',
      category: 'type',
      required: true,
      description: 'Validate TypeScript types without emitting files. Errors indicate type safety issues.',
    },
    {
      id: 'build',
      label: 'Production build',
      command: 'npm run build',
      category: 'build',
      required: true,
      description: 'Compile client and server bundles. Failures indicate compilation or bundling issues.',
    },
    {
      id: 'test',
      label: 'Vitest smoke tests',
      command: 'npm run test:ci',
      category: 'test',
      required: true,
      description: 'Run automated test suite in CI mode. Review test output for failures.',
    },
    {
      id: 'outdated',
      label: 'Dependency health check',
      command: 'npm outdated --json',
      category: 'dependency',
      required: true,
      description: 'Check for outdated dependencies. Review major version updates for breaking changes.',
    },
    {
      id: 'audit',
      label: 'Security vulnerability scan',
      command: 'npm audit --json',
      category: 'security',
      required: true,
      description: 'Scan for known vulnerabilities. Address high/critical issues before merging.',
    },
  ],
};
