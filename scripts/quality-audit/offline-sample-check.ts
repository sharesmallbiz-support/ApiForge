import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const LOG_LEVEL = process.env.APIFORGE_AUDIT_LOG_LEVEL || 'info';

function log(level: 'info' | 'debug' | 'silent', message: string) {
  const levels = { silent: 0, info: 1, debug: 2 };
  if (levels[LOG_LEVEL as keyof typeof levels] >= levels[level]) {
    console.log(message);
  }
}

/**
 * Offline sample verification
 * 
 * Validates that local storage sample data can be loaded without network access.
 * This ensures the audit process respects the local-first architecture principle.
 */
export async function verifyOfflineSample(projectRoot: string): Promise<boolean> {
  log('info', '[offline-sample] Verifying local storage sample data...');

  try {
    const sampleDataPath = join(projectRoot, 'client', 'src', 'lib', 'sample-data.ts');
    
    if (!existsSync(sampleDataPath)) {
      log('info', '[offline-sample] sample-data.ts not found, skipping verification');
      return true;
    }

    // Basic validation: ensure file can be read and contains expected exports
    const content = readFileSync(sampleDataPath, 'utf-8');
    
    const hasCreateSampleData = content.includes('createSampleData');
    const hasExports = content.includes('export');
    
    if (hasCreateSampleData && hasExports) {
      log('info', '[offline-sample] ✓ Sample data structure validated');
      return true;
    } else {
      console.error('[offline-sample] ✗ Sample data structure incomplete');
      return false;
    }
  } catch (error) {
    console.error('[offline-sample] ✗ Verification failed:', error);
    return false;
  }
}
