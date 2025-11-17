import { existsSync } from 'fs';
import { join } from 'path';
import { execa } from 'execa';

/**
 * Auto-install helper: detects missing node_modules and runs npm ci
 * 
 * Respects APIFORGE_SKIP_AUTO_INSTALL environment variable to bypass installation
 * in cached CI environments that manage dependencies externally.
 */

const LOG_LEVEL = process.env.APIFORGE_AUDIT_LOG_LEVEL || 'info';

function log(level: 'info' | 'debug' | 'silent', message: string) {
  const levels = { silent: 0, info: 1, debug: 2 };
  if (levels[LOG_LEVEL as keyof typeof levels] >= levels[level]) {
    console.log(message);
  }
}

export async function ensureDependencies(projectRoot: string): Promise<boolean> {
  const skipAutoInstall = process.env.APIFORGE_SKIP_AUTO_INSTALL === '1';
  
  if (skipAutoInstall) {
    log('debug', '[auto-install] Skipping auto-install (APIFORGE_SKIP_AUTO_INSTALL=1)');
    return true;
  }

  const nodeModulesPath = join(projectRoot, 'node_modules');
  const packageLockPath = join(projectRoot, 'package-lock.json');

  // Check for node_modules existence
  if (existsSync(nodeModulesPath)) {
    log('debug', '[auto-install] node_modules exists, skipping install');
    return true;
  }

  log('info', '[auto-install] node_modules missing, running npm ci...');

  try {
    await execa('npm', ['ci'], {
      cwd: projectRoot,
      stdio: 'inherit',
    });
    log('info', '[auto-install] npm ci completed successfully');
    return true;
  } catch (error) {
    console.error('[auto-install] npm ci failed:', error);
    return false;
  }
}
