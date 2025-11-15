export interface ParsedCurlCommand {
  method: string;
  url: string;
  headers: Array<{ key: string; value: string; enabled: boolean }>;
  body?: string;
}

export function parseCurlCommand(curlCommand: string): ParsedCurlCommand | null {
  try {
    // Remove newlines and extra spaces
    const cleaned = curlCommand.replace(/\\\n/g, ' ').replace(/\s+/g, ' ').trim();

    // Extract URL - look for patterns like curl 'url' or curl "url" or curl url
    const urlMatch = cleaned.match(/curl\s+(?:-[^\s]+\s+)*['"]?([^\s'"]+)['"]?/);
    if (!urlMatch) return null;

    let url = urlMatch[1];

    // Extract method
    const methodMatch = cleaned.match(/-X\s+(\w+)/i);
    const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';

    // Extract headers
    const headers: Array<{ key: string; value: string; enabled: boolean }> = [];
    const headerRegex = /-H\s+['"]([^:]+):\s*([^'"]+)['"]/g;
    let headerMatch;
    while ((headerMatch = headerRegex.exec(cleaned)) !== null) {
      headers.push({
        key: headerMatch[1].trim(),
        value: headerMatch[2].trim(),
        enabled: true,
      });
    }

    // Extract body
    let body: string | undefined;
    const dataMatch = cleaned.match(/--data(?:-raw|-binary)?\s+['"](.+?)['"]/);
    const dataMatch2 = cleaned.match(/-d\s+['"](.+?)['"]/);
    if (dataMatch) {
      body = dataMatch[1];
    } else if (dataMatch2) {
      body = dataMatch2[1];
    }

    // Try to parse and pretty-print JSON body
    if (body) {
      try {
        const parsed = JSON.parse(body);
        body = JSON.stringify(parsed, null, 2);
      } catch {
        // Keep original if not valid JSON
      }
    }

    return {
      method,
      url,
      headers,
      body,
    };
  } catch (error) {
    console.error('Failed to parse CURL command:', error);
    return null;
  }
}
