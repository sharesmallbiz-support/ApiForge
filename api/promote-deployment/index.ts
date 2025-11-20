import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function promoteDeployment(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Promote deployment request received');

    try {
        const body = await request.json() as {
            sourceSha: string;
            approvals?: string[];
        };

        if (!body.sourceSha) {
            return {
                status: 400,
                jsonBody: {
                    message: "Source SHA is required",
                    code: "MISSING_SOURCE_SHA"
                }
            };
        }

        // TODO: Implement GitHub Actions workflow dispatch or API call
        // For now, return acceptance response

        context.log(`Promotion requested for SHA: ${body.sourceSha}`);
        
        if (body.approvals && body.approvals.length > 0) {
            context.log(`Approvers: ${body.approvals.join(', ')}`);
        }

        return {
            status: 202,
            jsonBody: {
                message: "Promotion accepted",
                sourceSha: body.sourceSha,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        context.error('Error promoting deployment:', error);
        
        return {
            status: 500,
            jsonBody: {
                message: error instanceof Error ? error.message : "Internal server error",
                code: "PROMOTION_ERROR"
            }
        };
    }
}

app.http('promoteDeployment', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'deployments/promote',
    handler: promoteDeployment
});
