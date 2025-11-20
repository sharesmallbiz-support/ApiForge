import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function getExecutionHistory(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Fetching execution history');

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
        // TODO: Integrate with actual history storage/tracking
        // For now, return placeholder structure

        const historyItems = {
            items: [
                {
                    requestId,
                    status: "Success",
                    statusCode: 200,
                    headers: {},
                    bodyPreview: "Sample execution result",
                    durationMs: 1500,
                    startedAt: new Date(Date.now() - 3600000).toISOString(),
                    hostedTraceUrl: `https://portal.azure.com/#trace/sample-${requestId}`,
                    logs: ["Request executed successfully"]
                }
            ]
        };

        return {
            status: 200,
            jsonBody: historyItems
        };

    } catch (error) {
        context.error('Error fetching history:', error);
        
        return {
            status: 500,
            jsonBody: {
                message: error instanceof Error ? error.message : "Internal server error",
                code: "HISTORY_ERROR"
            }
        };
    }
}

app.http('getExecutionHistory', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'requests/{requestId}/history',
    handler: getExecutionHistory
});
