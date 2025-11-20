// Script execution utilities for Azure Functions
// Simplified from server/script-executor.ts

interface ScriptResult {
  logs: string[];
  error?: string;
  updatedVariables?: Record<string, string>;
}

export function executePostRequestScript(
  script: string,
  responseBody: any,
  responseStatus: number,
  responseHeaders: Record<string, string>,
  currentVariables: Record<string, string>
): ScriptResult {
  const logs: string[] = [];
  const updatedVariables = { ...currentVariables };

  if (!script || !script.trim()) {
    return { logs, updatedVariables };
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

    // Parse response body if string
    let parsedBody: any;
    try {
      parsedBody = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
    } catch {
      parsedBody = responseBody;
    }

    // Create pm API object (Postman-like)
    const pm = {
      response: {
        body: parsedBody,
        status: responseStatus,
        headers: responseHeaders,
        json: () => parsedBody,
        text: () => typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody),
      },
      environment: {
        get: (key: string) => updatedVariables[key],
        set: (key: string, value: string) => {
          updatedVariables[key] = String(value);
          logs.push(`Environment variable "${key}" = "${value}"`);
        },
        unset: (key: string) => {
          delete updatedVariables[key];
          logs.push(`Environment variable "${key}" removed`);
        },
      },
    };

    // Execute script in restricted context
    const scriptFunction = new Function('pm', 'console', script);
    scriptFunction(pm, safeConsole);

    return { logs, updatedVariables };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logs.push(`ERROR: ${errorMessage}`);
    return {
      logs,
      error: errorMessage,
      updatedVariables,
    };
  }
}
