export interface ParsedCurlCommand {
  method: string;
  url: string;
  headers: Array<{ key: string; value: string; enabled: boolean }>;
  params: Array<{ key: string; value: string; enabled: boolean }>;
  body?: string;
}

/**
 * Robust CURL command parser with fault tolerance and comprehensive error checking
 * Supports:
 * - Multiple header formats: -H, --header
 * - Query parameters extraction
 * - Multiple data formats: -d, --data, --data-raw, --data-binary
 * - Method extraction: -X, --request
 * - Various quoting styles (single, double, none)
 */
export function parseCurlCommand(curlCommand: string): ParsedCurlCommand | null {
  try {
    if (!curlCommand || typeof curlCommand !== 'string') {
      console.error('[CURL Parser] Invalid input: command must be a non-empty string');
      return null;
    }

    // Normalize line continuations and whitespace
    const cleaned = curlCommand
      .replace(/\\\r?\n/g, ' ')  // Handle both Unix and Windows line endings
      .replace(/\s+/g, ' ')       // Normalize multiple spaces
      .trim();

    if (!cleaned.toLowerCase().startsWith('curl')) {
      console.error('[CURL Parser] Command must start with "curl"');
      return null;
    }

    // Extract URL - handle various formats
    // Pattern: curl [options] 'url' or curl 'url' [options] or curl --location 'url'
    const urlPatterns = [
      /curl\s+(?:.*?\s+)?(?:--location\s+)?['"]([^'"]+)['"]/,  // Quoted URL
      /curl\s+(?:.*?\s+)?(?:--location\s+)?(\S+)/,              // Unquoted URL (fallback)
    ];

    let url: string | null = null;
    for (const pattern of urlPatterns) {
      const match = cleaned.match(pattern);
      if (match && match[1]) {
        // Validate it looks like a URL
        const candidate = match[1];
        if (candidate.match(/^https?:\/\//i) || candidate.includes('://')) {
          url = candidate;
          break;
        }
      }
    }

    if (!url) {
      console.error('[CURL Parser] Could not extract URL from command');
      return null;
    }

    // Extract query parameters from URL
    const params: Array<{ key: string; value: string; enabled: boolean }> = [];
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.forEach((value, key) => {
        params.push({
          key: decodeURIComponent(key),
          value: decodeURIComponent(value),
          enabled: true,
        });
      });
      // Clean URL (remove query string for storage)
      url = urlObj.origin + urlObj.pathname;
    } catch (urlError) {
      console.warn('[CURL Parser] Could not parse URL for query params:', urlError);
      // Continue with original URL if parsing fails
    }

    // Extract method - support both -X and --request
    const methodPatterns = [
      /(?:^|\s)(?:-X|--request)\s+['"]?(\w+)['"]?(?:\s|$)/i,
    ];

    let method = 'GET'; // Default
    for (const pattern of methodPatterns) {
      const match = cleaned.match(pattern);
      if (match && match[1]) {
        method = match[1].toUpperCase();
        break;
      }
    }

    // Validate method
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    if (!validMethods.includes(method)) {
      console.warn(`[CURL Parser] Unusual HTTP method: ${method}, using anyway`);
    }

    // Extract headers - support both -H and --header
    const headers: Array<{ key: string; value: string; enabled: boolean }> = [];

    // Multiple patterns to handle various quoting styles
    const headerPatterns = [
      /(?:^|\s)(?:-H|--header)\s+'([^']+)'/g,      // Single quotes
      /(?:^|\s)(?:-H|--header)\s+"([^"]+)"/g,      // Double quotes
      /(?:^|\s)(?:-H|--header)\s+([^\s-][^\s]*)/g, // No quotes (less common)
    ];

    for (const pattern of headerPatterns) {
      let match;
      const regex = new RegExp(pattern);
      const globalRegex = new RegExp(pattern.source, 'g');

      while ((match = globalRegex.exec(cleaned)) !== null) {
        const headerStr = match[1];
        if (!headerStr) continue;

        // Parse header into key:value
        const colonIndex = headerStr.indexOf(':');
        if (colonIndex === -1) {
          console.warn(`[CURL Parser] Invalid header format (missing colon): ${headerStr}`);
          continue;
        }

        const key = headerStr.substring(0, colonIndex).trim();
        const value = headerStr.substring(colonIndex + 1).trim();

        if (!key) {
          console.warn(`[CURL Parser] Invalid header format (empty key): ${headerStr}`);
          continue;
        }

        // Check for duplicates
        const existingIndex = headers.findIndex(h => h.key.toLowerCase() === key.toLowerCase());
        if (existingIndex !== -1) {
          console.warn(`[CURL Parser] Duplicate header "${key}", using latest value`);
          headers[existingIndex] = { key, value, enabled: true };
        } else {
          headers.push({ key, value, enabled: true });
        }
      }
    }

    // Extract body - support multiple formats
    let body: string | undefined;

    const bodyPatterns = [
      /(?:^|\s)(?:--data-raw)\s+'([^']+)'/,           // --data-raw with single quotes
      /(?:^|\s)(?:--data-raw)\s+"([^"]+)"/,           // --data-raw with double quotes
      /(?:^|\s)(?:--data-binary)\s+'([^']+)'/,        // --data-binary with single quotes
      /(?:^|\s)(?:--data-binary)\s+"([^"]+)"/,        // --data-binary with double quotes
      /(?:^|\s)(?:--data)\s+'([^']+)'/,               // --data with single quotes
      /(?:^|\s)(?:--data)\s+"([^"]+)"/,               // --data with double quotes
      /(?:^|\s)-d\s+'([^']+)'/,                       // -d with single quotes
      /(?:^|\s)-d\s+"([^"]+)"/,                       // -d with double quotes
    ];

    for (const pattern of bodyPatterns) {
      const match = cleaned.match(pattern);
      if (match && match[1]) {
        body = match[1];
        break;
      }
    }

    // Handle JSON body - validate and pretty-print
    if (body) {
      // Try to detect if it's JSON
      const trimmedBody = body.trim();
      if ((trimmedBody.startsWith('{') && trimmedBody.endsWith('}')) ||
          (trimmedBody.startsWith('[') && trimmedBody.endsWith(']'))) {
        try {
          const parsed = JSON.parse(body);
          body = JSON.stringify(parsed, null, 2);
          console.log('[CURL Parser] Successfully parsed and formatted JSON body');
        } catch (jsonError) {
          console.warn('[CURL Parser] Body looks like JSON but failed to parse:', jsonError);
          // Keep original body
        }
      }
    }

    // If we have a body but method is GET, suggest changing to POST
    if (body && method === 'GET') {
      console.warn('[CURL Parser] GET request with body detected, you may want to change method to POST');
      // Auto-correct to POST if body is present and method wasn't explicitly set
      if (!cleaned.match(/(?:^|\s)(?:-X|--request)/i)) {
        method = 'POST';
        console.log('[CURL Parser] Auto-corrected method to POST due to request body');
      }
    }

    const result = {
      method,
      url,
      headers,
      params,
      body,
    };

    console.log('[CURL Parser] Successfully parsed command:', {
      method: result.method,
      url: result.url,
      headersCount: result.headers.length,
      paramsCount: result.params.length,
      hasBody: !!result.body,
    });

    return result;
  } catch (error) {
    console.error('[CURL Parser] Unexpected error during parsing:', error);
    if (error instanceof Error) {
      console.error('[CURL Parser] Error details:', error.message, error.stack);
    }
    return null;
  }
}
