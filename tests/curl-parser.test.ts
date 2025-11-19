import { describe, it, expect } from 'vitest';
import { parseCurlCommand } from '../shared/curl-parser';

describe('CURL Parser', () => {
  describe('Basic Parsing', () => {
    it('should parse simple GET request', () => {
      const curl = `curl 'https://api.example.com/users'`;
      const result = parseCurlCommand(curl);

      expect(result).not.toBeNull();
      expect(result?.method).toBe('GET');
      expect(result?.url).toBe('https://api.example.com/users');
      expect(result?.headers).toEqual([]);
      expect(result?.params).toEqual([]);
      expect(result?.body).toBeUndefined();
    });

    it('should parse GET request with query parameters', () => {
      const curl = `curl 'https://api.example.com/users?page=1&limit=10'`;
      const result = parseCurlCommand(curl);

      expect(result).not.toBeNull();
      expect(result?.url).toBe('https://api.example.com/users');
      expect(result?.params).toHaveLength(2);
      expect(result?.params).toContainEqual({ key: 'page', value: '1', enabled: true });
      expect(result?.params).toContainEqual({ key: 'limit', value: '10', enabled: true });
    });

    it('should handle POST request with -X flag', () => {
      const curl = `curl -X POST 'https://api.example.com/users'`;
      const result = parseCurlCommand(curl);

      expect(result?.method).toBe('POST');
    });

    it('should handle POST request with --request flag', () => {
      const curl = `curl --request POST 'https://api.example.com/users'`;
      const result = parseCurlCommand(curl);

      expect(result?.method).toBe('POST');
    });
  });

  describe('Header Parsing', () => {
    it('should parse single header with -H flag', () => {
      const curl = `curl 'https://api.example.com/users' -H 'Content-Type: application/json'`;
      const result = parseCurlCommand(curl);

      expect(result?.headers).toHaveLength(1);
      expect(result?.headers[0]).toEqual({
        key: 'Content-Type',
        value: 'application/json',
        enabled: true
      });
    });

    it('should parse single header with --header flag', () => {
      const curl = `curl 'https://api.example.com/users' --header 'Authorization: Bearer token123'`;
      const result = parseCurlCommand(curl);

      expect(result?.headers).toHaveLength(1);
      expect(result?.headers[0].key).toBe('Authorization');
      expect(result?.headers[0].value).toBe('Bearer token123');
    });

    it('should parse multiple headers', () => {
      const curl = `curl 'https://api.example.com/users' -H 'Content-Type: application/json' -H 'Authorization: Bearer token123' -H 'X-Custom-Header: custom-value'`;
      const result = parseCurlCommand(curl);

      expect(result?.headers).toHaveLength(3);
    });

    it('should handle double-quoted headers', () => {
      const curl = `curl 'https://api.example.com/users' -H "Content-Type: application/json"`;
      const result = parseCurlCommand(curl);

      expect(result?.headers).toHaveLength(1);
      expect(result?.headers[0].key).toBe('Content-Type');
    });

    it('should NOT create duplicate headers', () => {
      const curl = `curl 'https://api.example.com/users' -H 'Content-Type: application/json' -H 'Content-Type: text/plain'`;
      const result = parseCurlCommand(curl);

      expect(result?.headers).toHaveLength(1);
      expect(result?.headers[0].value).toBe('text/plain'); // Latest value wins
    });

    it('should parse complex headers with special characters', () => {
      const curl = `curl 'https://api.example.com' --header 'User-Agent: Mozilla/5.0,(Windows NT 10.0; Win64; x64),AppleWebKit/537.36'`;
      const result = parseCurlCommand(curl);

      expect(result?.headers).toHaveLength(1);
      expect(result?.headers[0].value).toContain('Mozilla/5.0');
    });
  });

  describe('Body Parsing', () => {
    it('should parse body with -d flag', () => {
      const curl = `curl -X POST 'https://api.example.com/users' -d '{"name":"John"}'`;
      const result = parseCurlCommand(curl);

      expect(result?.body).toBeTruthy();
    });

    it('should parse body with --data flag', () => {
      const curl = `curl -X POST 'https://api.example.com/users' --data '{"name":"John"}'`;
      const result = parseCurlCommand(curl);

      expect(result?.body).toBeTruthy();
    });

    it('should parse body with --data-raw flag', () => {
      const curl = `curl -X POST 'https://api.example.com/users' --data-raw '{"name":"John"}'`;
      const result = parseCurlCommand(curl);

      expect(result?.body).toBeTruthy();
    });

    it('should format JSON body nicely', () => {
      const curl = `curl -X POST 'https://api.example.com/users' -d '{"name":"John","age":30}'`;
      const result = parseCurlCommand(curl);

      expect(result?.body).toContain('\n'); // Pretty-printed
      expect(result?.body).toContain('  '); // Indented
    });

    it('should auto-correct GET to POST when body is present', () => {
      const curl = `curl 'https://api.example.com/users' -d '{"name":"John"}'`;
      const result = parseCurlCommand(curl);

      expect(result?.method).toBe('POST'); // Auto-corrected
    });

    it('should NOT auto-correct if method is explicitly set', () => {
      const curl = `curl -X GET 'https://api.example.com/users' -d '{"name":"John"}'`;
      const result = parseCurlCommand(curl);

      expect(result?.method).toBe('GET'); // Respects explicit method
    });

    it('should handle non-JSON body', () => {
      const curl = `curl -X POST 'https://api.example.com/users' -d 'plain text body'`;
      const result = parseCurlCommand(curl);

      expect(result?.body).toBe('plain text body');
    });
  });

  describe('Complex Real-World Examples', () => {
    it('should parse the provided sample CURL command', () => {
      const curl = `curl --location 'https://triage-nonprod.bswhive.com/v1/display_card/ee791791-b133-4c1e-a980-c84d56a53345' --header 'X-API-KEY: 770b9665-5d24-4a81-bd5e-4c9e641ad355' --header 'bsw-CorrelationId: mark-test-correlation-2' --header 'bsw-SessionId: mark-test-session-2' --header 'User-Agent: Mozilla/5.0,(Windows NT 10.0; Win64; x64),AppleWebKit/537.36,(KHTML, like Gecko),Chrome/58.0.3029.110,Safari/537.3' --header 'Accept: application/json' --header 'Accept-Language: en-US,en; q=0.9' --header 'Content-Type: application/json'`;

      const result = parseCurlCommand(curl);

      expect(result).not.toBeNull();
      expect(result?.method).toBe('GET');
      expect(result?.url).toBe('https://triage-nonprod.bswhive.com/v1/display_card/ee791791-b133-4c1e-a980-c84d56a53345');
      expect(result?.headers).toHaveLength(7);

      // Verify specific headers
      const apiKeyHeader = result?.headers.find(h => h.key === 'X-API-KEY');
      expect(apiKeyHeader?.value).toBe('770b9665-5d24-4a81-bd5e-4c9e641ad355');

      const sessionHeader = result?.headers.find(h => h.key === 'bsw-SessionId');
      expect(sessionHeader?.value).toBe('mark-test-session-2');

      // Ensure no duplicate headers with leading quotes
      const headerKeys = result?.headers.map(h => h.key) || [];
      expect(headerKeys.every(k => !k.startsWith("'"))).toBe(true);
    });

    it('should handle CURL with POST and JSON body', () => {
      const curl = `curl -X POST 'https://api.example.com/users' -H 'Content-Type: application/json' -H 'Authorization: Bearer token123' -d '{"name":"John Doe","email":"john@example.com","age":30}'`;

      const result = parseCurlCommand(curl);

      expect(result?.method).toBe('POST');
      expect(result?.headers).toHaveLength(2);
      expect(result?.body).toBeTruthy();

      // Verify JSON was parsed and formatted
      const parsed = JSON.parse(result!.body!);
      expect(parsed.name).toBe('John Doe');
      expect(parsed.email).toBe('john@example.com');
      expect(parsed.age).toBe(30);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should return null for invalid input', () => {
      const result = parseCurlCommand('');
      expect(result).toBeNull();
    });

    it('should return null for non-string input', () => {
      const result = parseCurlCommand(null as any);
      expect(result).toBeNull();
    });

    it('should return null for command not starting with curl', () => {
      const result = parseCurlCommand('wget https://example.com');
      expect(result).toBeNull();
    });

    it('should return null for command without URL', () => {
      const result = parseCurlCommand('curl -H "Header: value"');
      expect(result).toBeNull();
    });

    it('should handle line continuations with backslash-newline', () => {
      const curl = "curl 'https://api.example.com'\\\n-H 'Content-Type: application/json'";
      const result = parseCurlCommand(curl);

      expect(result).not.toBeNull();
      expect(result?.headers).toHaveLength(1);
    });

    it('should skip invalid headers without colon', () => {
      const curl = `curl 'https://api.example.com' -H 'Invalid Header' -H 'Valid: Header'`;
      const result = parseCurlCommand(curl);

      expect(result?.headers).toHaveLength(1);
      expect(result?.headers[0].key).toBe('Valid');
    });

    it('should handle URL-encoded query parameters', () => {
      const curl = `curl 'https://api.example.com/search?q=hello%20world&filter=active'`;
      const result = parseCurlCommand(curl);

      expect(result?.params).toHaveLength(2);
      expect(result?.params[0].value).toBe('hello world'); // Decoded
    });

    it('should handle various HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

      for (const method of methods) {
        const curl = `curl -X ${method} 'https://api.example.com/resource'`;
        const result = parseCurlCommand(curl);
        expect(result?.method).toBe(method);
      }
    });
  });

  describe('Performance and Robustness', () => {
    it('should handle very long CURL commands', () => {
      const headers = Array.from({ length: 50 }, (_, i) =>
        `--header 'Header-${i}: value-${i}'`
      ).join(' ');

      const curl = `curl 'https://api.example.com' ${headers}`;
      const result = parseCurlCommand(curl);

      expect(result).not.toBeNull();
      expect(result?.headers).toHaveLength(50);
    });

    it('should handle CURL with --location flag', () => {
      const curl = `curl --location 'https://api.example.com/redirect'`;
      const result = parseCurlCommand(curl);

      expect(result).not.toBeNull();
      expect(result?.url).toBe('https://api.example.com/redirect');
    });

    it('should preserve header order', () => {
      const curl = `curl 'https://api.example.com' -H 'First: 1' -H 'Second: 2' -H 'Third: 3'`;

      const result = parseCurlCommand(curl);

      expect(result?.headers[0].key).toBe('First');
      expect(result?.headers[1].key).toBe('Second');
      expect(result?.headers[2].key).toBe('Third');
    });
  });
});
