// Application Insights telemetry utilities for Azure Functions
// Provides structured logging and trace correlation

import { InvocationContext } from "@azure/functions";

export interface TelemetryProperties {
  requestId?: string;
  workspaceId?: string;
  method?: string;
  url?: string;
  duration?: number;
  statusCode?: number;
  success?: boolean;
  hostedRunUrl?: string;
}

/**
 * Log execution start with context
 */
export function logExecutionStart(
  context: InvocationContext,
  requestId: string,
  workspaceId: string,
  method: string,
  url: string
): void {
  const properties: TelemetryProperties = {
    requestId,
    workspaceId,
    method,
    url,
  };

  context.log("Request execution started", properties);
  context.trace(`Executing ${method} request ${requestId} for workspace ${workspaceId}`);
}

/**
 * Log execution completion with metrics
 */
export function logExecutionComplete(
  context: InvocationContext,
  requestId: string,
  duration: number,
  statusCode: number,
  success: boolean
): void {
  const properties: TelemetryProperties = {
    requestId,
    duration,
    statusCode,
    success,
    hostedRunUrl: buildTraceUrl(context),
  };

  if (success) {
    context.log(`Request execution completed successfully`, properties);
  } else {
    context.warn(`Request execution completed with errors`, properties);
  }

  // Track custom metric for latency
  context.trace(`Request ${requestId} completed in ${duration}ms with status ${statusCode}`);
}

/**
 * Log execution error
 */
export function logExecutionError(
  context: InvocationContext,
  requestId: string,
  error: Error | unknown
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const properties: TelemetryProperties = {
    requestId,
    success: false,
  };

  context.error(`Request execution failed: ${errorMessage}`, properties);
  
  if (errorStack) {
    context.error(errorStack);
  }
}

/**
 * Build Application Insights trace URL for hosted run
 */
export function buildTraceUrl(context: InvocationContext): string {
  // This URL format works with Application Insights transaction search
  // Note: Actual subscription/resource IDs should be injected via environment variables
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || "{subscriptionId}";
  const resourceGroup = process.env.AZURE_RESOURCE_GROUP || "{resourceGroup}";
  const appInsightsName = process.env.APPINSIGHTS_NAME || "{appInsights}";

  return `https://portal.azure.com/#view/Microsoft_Azure_Monitoring_Logs/LogsBlade/resourceId/%2Fsubscriptions%2F${subscriptionId}%2FresourceGroups%2F${resourceGroup}%2Fproviders%2Fmicrosoft.insights%2Fcomponents%2F${appInsightsName}/source/LogsBlade.AnalyticsShareLinkToQuery/q/${encodeURIComponent(`traces | where operation_Id == "${context.invocationId}"`)}/timespan/P1D`;
}

/**
 * Log script execution
 */
export function logScriptExecution(
  context: InvocationContext,
  requestId: string,
  scriptType: "pre" | "post",
  success: boolean,
  logs: string[]
): void {
  const properties: TelemetryProperties = {
    requestId,
    success,
  };

  context.log(`${scriptType}-request script execution ${success ? "succeeded" : "failed"}`, properties);
  
  // Log script output
  logs.forEach(log => context.trace(`Script: ${log}`));
}

/**
 * Track cold start
 */
export function trackColdStart(context: InvocationContext): void {
  // Check if this is a cold start (simplified detection)
  const isColdStart = !global.warmupComplete;
  
  if (isColdStart) {
    context.warn("Function cold start detected", { coldStart: true });
    global.warmupComplete = true;
  }
}

// Extend global to track warmup state
declare global {
  var warmupComplete: boolean | undefined;
}
