import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeRequest } from '../../api/execute-request/index';
import { HttpRequest, InvocationContext } from '@azure/functions';
import * as httpUtils from '../../api/shared/http-utils';
import * as scriptUtils from '../../api/shared/script-utils';
import * as telemetry from '../../api/shared/telemetry';

// Mock dependencies
vi.mock('../../api/shared/http-utils');
vi.mock('../../api/shared/script-utils');
vi.mock('../../api/shared/telemetry');

describe('executeRequest', () => {
  let mockRequest: HttpRequest;
  let mockContext: InvocationContext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      invocationId: 'test-invocation-id',
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    } as unknown as InvocationContext;

    mockRequest = {
      params: { requestId: 'req-123' },
      json: vi.fn(),
    } as unknown as HttpRequest;
  });

  it('should return 400 if requestId is missing', async () => {
    const req = { ...mockRequest, params: {} } as unknown as HttpRequest;
    const result = await executeRequest(req, mockContext);
    expect(result.status).toBe(400);
  });

  it('should return 400 if payload is invalid', async () => {
    (mockRequest.json as any).mockResolvedValue({});
    const result = await executeRequest(mockRequest, mockContext);
    expect(result.status).toBe(400);
  });

  it('should execute request successfully', async () => {
    const payload = {
      workspaceId: 'ws-1',
      resolvedRequest: {
        url: 'https://api.example.com',
        method: 'GET',
      },
    };
    (mockRequest.json as any).mockResolvedValue(payload);

    (httpUtils.substituteVariables as any).mockImplementation((s: string) => s);
    (httpUtils.executeHttpRequest as any).mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      body: '{"foo":"bar"}',
      time: 100,
      size: 15,
    });

    const result = await executeRequest(mockRequest, mockContext);

    expect(result.status).toBe(200);
    expect(httpUtils.executeHttpRequest).toHaveBeenCalled();
    expect(telemetry.logExecutionStart).toHaveBeenCalled();
    expect(telemetry.logExecutionComplete).toHaveBeenCalled();
    
    const body = (result as any).jsonBody;
    expect(body.status).toBe('Success');
    expect(body.statusCode).toBe(200);
  });

  it('should handle execution errors', async () => {
    const payload = {
      workspaceId: 'ws-1',
      resolvedRequest: {
        url: 'https://api.example.com',
        method: 'GET',
      },
    };
    (mockRequest.json as any).mockResolvedValue(payload);

    (httpUtils.substituteVariables as any).mockImplementation((s: string) => s);
    (httpUtils.executeHttpRequest as any).mockRejectedValue(new Error('Network error'));

    const result = await executeRequest(mockRequest, mockContext);

    expect(result.status).toBe(500);
    expect(telemetry.logExecutionError).toHaveBeenCalled();
  });
});
