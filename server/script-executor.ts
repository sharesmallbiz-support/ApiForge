import type { ExecutionResult, Environment } from "@shared/schema";

interface ScriptContext {
  response: {
    body: any;
    status: number;
    headers: Record<string, string>;
    json: () => any;
    text: () => string;
  };
  environment: Environment;
}

interface ScriptResult {
  updatedEnvironment?: Environment;
  logs: string[];
  error?: string;
}

export function executeScript(
  script: string,
  executionResult: ExecutionResult,
  environment?: Environment
): ScriptResult {
  const logs: string[] = [];
  let updatedEnvironment = environment ? { ...environment } : undefined;

  // If no environment or no script, return early
  if (!script.trim()) {
    return { logs, updatedEnvironment };
  }

  try {
    // Create a safe console.log that captures logs
    const safeConsole = {
      log: (...args: any[]) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '));
      },
      error: (...args: any[]) => {
        logs.push('ERROR: ' + args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '));
      },
      warn: (...args: any[]) => {
        logs.push('WARN: ' + args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '));
      },
    };

    // Parse response body
    let parsedBody: any;
    try {
      parsedBody = typeof executionResult.body === 'string' 
        ? JSON.parse(executionResult.body) 
        : executionResult.body;
    } catch {
      parsedBody = executionResult.body;
    }

    // Create pm API object
    const pm = {
      response: {
        body: parsedBody,
        status: executionResult.status,
        headers: executionResult.headers,
        json: () => parsedBody,
        text: () => typeof executionResult.body === 'string' 
          ? executionResult.body 
          : JSON.stringify(executionResult.body),
      },
      environment: {
        get: (key: string) => {
          if (!updatedEnvironment) return undefined;
          const variable = updatedEnvironment.variables.find(v => v.key === key && v.enabled);
          return variable?.value;
        },
        set: (key: string, value: string) => {
          if (!updatedEnvironment) {
            logs.push(`WARN: Cannot set environment variable "${key}" - no environment selected`);
            return;
          }
          
          // Find existing variable or add new one
          const existingIndex = updatedEnvironment.variables.findIndex(v => v.key === key);
          if (existingIndex >= 0) {
            updatedEnvironment.variables[existingIndex] = {
              ...updatedEnvironment.variables[existingIndex],
              value: String(value),
            };
          } else {
            updatedEnvironment.variables.push({
              key,
              value: String(value),
              enabled: true,
              scope: "global",
            });
          }
          
          logs.push(`Environment variable "${key}" = "${value}"`);
        },
        unset: (key: string) => {
          if (!updatedEnvironment) return;
          updatedEnvironment.variables = updatedEnvironment.variables.filter(v => v.key !== key);
          logs.push(`Environment variable "${key}" removed`);
        },
      },
    };

    // Create a restricted Function to execute the script
    // Use Function constructor instead of eval for slightly better isolation
    const scriptFunction = new Function('pm', 'console', script);
    scriptFunction(pm, safeConsole);

    return {
      updatedEnvironment,
      logs,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logs.push(`ERROR: ${errorMessage}`);
    return {
      updatedEnvironment,
      logs,
      error: errorMessage,
    };
  }
}
