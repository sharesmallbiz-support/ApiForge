import { describe, it, expect } from 'vitest';
import { BASELINE_CHECKLIST } from '../../scripts/quality-audit/checklist';

describe('Quality Audit Checklist', () => {
  it('should have valid version', () => {
    expect(BASELINE_CHECKLIST.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should enable auto-install by default', () => {
    expect(BASELINE_CHECKLIST.autoInstall).toBe(true);
  });

  it('should define all required baseline categories', () => {
    const categories = BASELINE_CHECKLIST.steps.map(s => s.category);
    const requiredCategories = ['lint', 'type', 'build', 'test', 'dependency', 'security'];
    
    for (const category of requiredCategories) {
      expect(categories).toContain(category);
    }
  });

  it('should have unique step IDs', () => {
    const ids = BASELINE_CHECKLIST.steps.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have required flag on all baseline steps', () => {
    const allRequired = BASELINE_CHECKLIST.steps.every(s => s.required === true);
    expect(allRequired).toBe(true);
  });

  it('should have valid commands for each step', () => {
    const validCommands = [
      'npm run lint',
      'npm run check',
      'npm run build',
      'npm run test:ci',
      'npm outdated --json',
      'npm audit --json',
    ];

    const commands = BASELINE_CHECKLIST.steps.map(s => s.command);
    
    for (const command of commands) {
      expect(validCommands).toContain(command);
    }
  });

  it('should execute steps in correct order', () => {
    const expectedOrder = ['lint', 'typecheck', 'build', 'test', 'outdated', 'audit'];
    const actualOrder = BASELINE_CHECKLIST.steps.map(s => s.id);
    expect(actualOrder).toEqual(expectedOrder);
  });

  it('should include helpful descriptions', () => {
    for (const step of BASELINE_CHECKLIST.steps) {
      expect(step.description).toBeTruthy();
      expect(step.description.length).toBeGreaterThan(10);
    }
  });
});
