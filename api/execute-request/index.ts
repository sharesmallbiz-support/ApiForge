import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { executeHttpRequest, substituteVariables, buildUrlWithParams } from "../shared/http-utils";
import { executePostRequestScript } from "../shared/script-utils";
import { logExecutionStart, logExecutionComplete, logExecutionError, logScriptExecution, trackColdStart } from "../shared/telemetry";

export async function executeRequest(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Track cold starts for monitoring
    trackColdStart(context);

    const requestId = request.params.requestId;
    
    if (!requestId) {
        return {
            status: 400,
            jsonBody: {
                message: "Request ID is required",
                code: "MISSING_REQUEST_ID"
            }
        };
    }

    try {
        // Parse request body
        const body = await request.json() as {
            workspaceId: string;
            resolvedRequest: {
                url: string;
                method: string;
                headers?: Array<{ key: string; value: string; enabled: boolean }>;
                params?: Array<{ key: string; value: string; enabled: boolean }>;
                body?: string;
            };
            environmentSnapshot?: Record<string, string>;
            scripts?: {
                preRequest?: string;
                postRequest?: string;
            };
        };

        // Validate required fields
        if (!body.workspaceId || !body.resolvedRequest) {
            return {
                status: 400,
                jsonBody: {
                    message: "Missing required fields: workspaceId and resolvedRequest",
                    code: "INVALID_PAYLOAD"
                }
            };
        }

        const startTime = Date.now();
        const logs: string[] = [];
        const variables = body.environmentSnapshot || {};

        // Log execution start with telemetry
        logExecutionStart(
            context,
            requestId,
            body.workspaceId,
            body.resolvedRequest.method,
            body.resolvedRequest.url
        );

        logs.push(`Request ${requestId} execution started`);
        logs.push(`Workspace: ${body.workspaceId}`);
        logs.push(`Method: ${body.resolvedRequest.method}`);

        // Substitute variables in URL
        let url = substituteVariables(body.resolvedRequest.url, variables);
        
        // Add query parameters
        if (body.resolvedRequest.params && body.resolvedRequest.params.length > 0) {
            url = buildUrlWithParams(url, body.resolvedRequest.params);
        }

        logs.push(`Resolved URL: ${url}`);

        // Build headers object with variable substitution
        const headers: Record<string, string> = {};
        if (body.resolvedRequest.headers) {
            body.resolvedRequest.headers
                .filter(h => h.enabled)
                .forEach(h => {
                    const key = substituteVariables(h.key, variables);
                    const value = substituteVariables(h.value, variables);
                    headers[key] = value;
                });
        }

        // Substitute variables in body
        let requestBody: string | undefined;
        if (body.resolvedRequest.body) {
            requestBody = substituteVariables(body.resolvedRequest.body, variables);
        }

        // Execute HTTP request
        const httpResult = await executeHttpRequest(
            body.resolvedRequest.method,
            url,
            headers,
            requestBody
        );

        logs.push(`HTTP request completed: ${httpResult.status} ${httpResult.statusText}`);
        logs.push(`Duration: ${httpResult.time}ms`);
        logs.push(`Response size: ${httpResult.size} bytes`);

        // Execute post-request script if present
        let scriptError: string | undefined;
        if (body.scripts?.postRequest) {
            logs.push('Executing post-request script...');
            const scriptResult = executePostRequestScript(
                body.scripts.postRequest,
                httpResult.body,
                httpResult.status,
                httpResult.headers,
                variables
            );
            
            logs.push(...scriptResult.logs);
            if (scriptResult.error) {
                scriptError = scriptResult.error;
                logs.push(`Script execution failed: ${scriptResult.error}`);
            }

            // Log script execution telemetry
            logScriptExecution(
                context,
                requestId,
                'post',
                !scriptResult.error,
                scriptResult.logs
            );
        }

        const totalDuration = Date.now() - startTime;
        const success = httpResult.status > 0 && httpResult.status < 400;

        // Log completion telemetry
        logExecutionComplete(
            context,
            requestId,
            totalDuration,
            httpResult.status,
            success
        );

        // Build execution result matching the contract
        const executionResult = {
            requestId,
            status: success ? "Success" : "Failure",
            statusCode: httpResult.status,
            headers: httpResult.headers,
            bodyPreview: httpResult.body.substring(0, 10000), // Limit body size
            durationMs: totalDuration,
            startedAt: new Date(startTime).toISOString(),
            hostedTraceUrl: `https://portal.azure.com/#view/Microsoft_Azure_Monitoring_Logs/LogsBlade/resourceId/%2Fsubscriptions%2F{sub}%2FresourceGroups%2F{rg}%2Fproviders%2Fmicrosoft.insights%2Fcomponents%2F{app}/correlationId/${context.invocationId}`,
            logs
        };

        return {
            status: 200,
            jsonBody: executionResult
        };

    } catch (error) {
        logExecutionError(context, requestId, error);
        
        return {
            status: 500,
            jsonBody: {
                message: error instanceof Error ? error.message : "Internal server error",
                code: "EXECUTION_ERROR",
                details: [error instanceof Error ? error.stack : String(error)]
            }
        };
    }
}

app.http('executeRequest', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'requests/{requestId}/execute',
    handler: executeRequest
});
