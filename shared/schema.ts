import { z } from "zod";

// HTTP Method enum
export const httpMethodSchema = z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]);
export type HttpMethod = z.infer<typeof httpMethodSchema>;

// Key-Value Pair
export const keyValuePairSchema = z.object({
  key: z.string(),
  value: z.string(),
  enabled: z.boolean(),
});
export type KeyValuePair = z.infer<typeof keyValuePairSchema>;
export type KeyValue = KeyValuePair; // Alias for convenience

// Request Body
export const requestBodySchema = z.object({
  type: z.enum(["json", "form", "raw"]),
  content: z.string(),
}).optional();
export type RequestBody = z.infer<typeof requestBodySchema>;

// Request Auth
export const requestAuthSchema = z.object({
  type: z.enum(["bearer", "basic", "apikey"]),
  token: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  key: z.string().optional(),
  value: z.string().optional(),
}).optional();
export type RequestAuth = z.infer<typeof requestAuthSchema>;

// Request
export const requestSchema = z.object({
  id: z.string(),
  name: z.string(),
  method: httpMethodSchema,
  url: z.string(),
  folderId: z.string(),
  headers: z.array(keyValuePairSchema).default([]),
  params: z.array(keyValuePairSchema).default([]),
  body: requestBodySchema,
  auth: requestAuthSchema,
  script: z.string().optional(),
  // Hosted execution metadata (optional)
  lastHostedRun: z.string().optional(),
  hostedRunResult: z.enum(["Success", "Failure", "Timeout"]).optional(),
  hostedRunUrl: z.string().optional(),
});

export const insertRequestSchema = requestSchema.omit({ id: true });
export type Request = z.infer<typeof requestSchema>;
export type InsertRequest = z.infer<typeof insertRequestSchema>;

// Folder
export const folderSchema = z.object({
  id: z.string(),
  name: z.string(),
  collectionId: z.string(),
  parentId: z.string().optional(),
  requests: z.array(requestSchema).default([]),
});

export const insertFolderSchema = folderSchema.omit({ id: true, requests: true });
export type Folder = z.infer<typeof folderSchema>;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

// Collection
export const collectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  workspaceId: z.string(),
  folders: z.array(folderSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const insertCollectionSchema = collectionSchema.omit({ 
  id: true, 
  folders: true,
  createdAt: true, 
  updatedAt: true 
});
export type Collection = z.infer<typeof collectionSchema>;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;

// Workspace
export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  collections: z.array(collectionSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const insertWorkspaceSchema = workspaceSchema.omit({ 
  id: true, 
  collections: true,
  createdAt: true, 
  updatedAt: true 
});
export type Workspace = z.infer<typeof workspaceSchema>;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;

// Environment Variable Scope
export const variableScopeSchema = z.enum(["global", "workspace", "collection"]);
export type VariableScope = z.infer<typeof variableScopeSchema>;

// Environment Variable
export const environmentVariableSchema = z.object({
  key: z.string(),
  value: z.string(),
  enabled: z.boolean(),
  scope: variableScopeSchema.default("global"),
  scopeId: z.string().optional(), // workspaceId or collectionId depending on scope
});
export type EnvironmentVariable = z.infer<typeof environmentVariableSchema>;

// Environment
export const environmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  variables: z.array(environmentVariableSchema).default([]),
  headers: z.array(keyValuePairSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const insertEnvironmentSchema = environmentSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type Environment = z.infer<typeof environmentSchema>;
export type InsertEnvironment = z.infer<typeof insertEnvironmentSchema>;

// Variable Extraction
export const variableExtractionSchema = z.object({
  name: z.string(),
  source: z.enum(["body", "headers", "status"]),
  path: z.string(),
});
export type VariableExtraction = z.infer<typeof variableExtractionSchema>;

// Assertion
export const assertionSchema = z.object({
  type: z.enum(["status", "body", "header", "time"]),
  operator: z.enum(["equals", "contains", "lessThan", "greaterThan"]),
  expected: z.union([z.string(), z.number()]),
  actual: z.union([z.string(), z.number()]).optional(),
  passed: z.boolean().optional(),
});
export type Assertion = z.infer<typeof assertionSchema>;

// Workflow Step
export const workflowStepSchema = z.object({
  id: z.string(),
  order: z.number(),
  requestId: z.string(),
  extractVariables: z.array(variableExtractionSchema).optional(),
  assertions: z.array(assertionSchema).optional(),
});
export type WorkflowStep = z.infer<typeof workflowStepSchema>;

// Workflow
export const workflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(workflowStepSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const insertWorkflowSchema = workflowSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type Workflow = z.infer<typeof workflowSchema>;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

// Execution Result
export const executionResultSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  status: z.number(),
  statusText: z.string(),
  headers: z.record(z.string()),
  body: z.any(),
  time: z.number(),
  size: z.number(),
  timestamp: z.string(),
  // Hosted execution metadata (optional)
  lastHostedRun: z.string().optional(),
  hostedRunResult: z.enum(["Success", "Failure", "Timeout"]).optional(),
  hostedRunUrl: z.string().optional(),
});
export type ExecutionResult = z.infer<typeof executionResultSchema>;

// Deployment Environment Status
export const deploymentStatusSchema = z.enum(["Provisioning", "Ready", "Failed", "Degraded"]);
export type DeploymentStatus = z.infer<typeof deploymentStatusSchema>;

// Deployment Environment
export const deploymentEnvironmentSchema = z.object({
  id: z.string(),
  swaResourceId: z.string(),
  staticAssetSource: z.string(),
  functionsPackage: z.string(),
  customDomains: z.array(z.string()).default([]),
  status: deploymentStatusSchema,
  lastDeployedSha: z.string().optional(),
  lastPromotedAt: z.string().optional(),
});
export type DeploymentEnvironment = z.infer<typeof deploymentEnvironmentSchema>;

// Secret Binding Provider
export const secretProviderSchema = z.enum(["SWASetting", "KeyVaultReference"]);
export type SecretProvider = z.infer<typeof secretProviderSchema>;

// Secret Binding
export const secretBindingSchema = z.object({
  name: z.string(),
  slot: z.enum(["preview", "production"]),
  provider: secretProviderSchema,
  version: z.string().optional(),
  expiresOn: z.string().optional(),
  required: z.boolean().default(false),
});
export type SecretBinding = z.infer<typeof secretBindingSchema>;

// Function App Runtime
export const functionRuntimeSchema = z.enum(["node18"]);
export type FunctionRuntime = z.infer<typeof functionRuntimeSchema>;

// Function App State
export const functionAppStateSchema = z.enum(["Draft", "Bundled", "Active", "Deprecated"]);
export type FunctionAppState = z.infer<typeof functionAppStateSchema>;

// Function Binding
export const functionBindingSchema = z.object({
  type: z.string(),
  direction: z.enum(["in", "out"]),
  name: z.string(),
  authLevel: z.enum(["anonymous", "function", "admin"]).optional(),
  methods: z.array(z.string()).optional(),
  route: z.string().optional(),
});
export type FunctionBinding = z.infer<typeof functionBindingSchema>;

// Function App
export const functionAppSchema = z.object({
  name: z.string(),
  runtime: functionRuntimeSchema,
  entryPoints: z.array(z.string()).default([]),
  bindings: z.array(functionBindingSchema).default([]),
  dependenciesHash: z.string().optional(),
  telemetryKey: z.string().optional(),
  state: functionAppStateSchema.default("Draft"),
});
export type FunctionApp = z.infer<typeof functionAppSchema>;

// Telemetry Signal Source
export const telemetrySourceSchema = z.enum(["ApplicationInsights", "AzureMonitor"]);
export type TelemetrySource = z.infer<typeof telemetrySourceSchema>;

// Telemetry Alert State
export const alertStateSchema = z.enum(["Healthy", "Warning", "Critical"]);
export type AlertState = z.infer<typeof alertStateSchema>;

// Telemetry Signal
export const telemetrySignalSchema = z.object({
  signalId: z.string(),
  source: telemetrySourceSchema,
  targetThreshold: z.union([z.number(), z.string()]),
  currentValue: z.number().optional(),
  alertState: alertStateSchema.default("Healthy"),
  lastUpdated: z.string().optional(),
  notificationHooks: z.array(z.string()).default([]),
});
export type TelemetrySignal = z.infer<typeof telemetrySignalSchema>;

// OpenAPI Import
export const openApiImportSchema = z.object({
  url: z.string().optional(),
  spec: z.any().optional(),
  workspaceId: z.string(),
});
export type OpenApiImport = z.infer<typeof openApiImportSchema>;

// Postman Import
export const postmanImportSchema = z.object({
  collection: z.any().optional(),
  environment: z.any().optional(),
  workspaceId: z.string(),
});
export type PostmanImport = z.infer<typeof postmanImportSchema>;

// Quality Audit - Step Category
export const auditStepCategorySchema = z.enum(["lint", "type", "build", "test", "dependency", "security"]);
export type AuditStepCategory = z.infer<typeof auditStepCategorySchema>;

// Quality Audit - Step Status
export const auditStepStatusSchema = z.enum(["passed", "failed", "skipped"]);
export type AuditStepStatus = z.infer<typeof auditStepStatusSchema>;

// Quality Audit Step
export const qualityAuditStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  command: z.string(),
  category: auditStepCategorySchema,
  required: z.boolean(),
  description: z.string(),
});
export type QualityAuditStep = z.infer<typeof qualityAuditStepSchema>;

// Quality Audit Checklist
export const qualityAuditChecklistSchema = z.object({
  version: z.string(),
  steps: z.array(qualityAuditStepSchema),
  autoInstall: z.boolean().default(true),
});
export type QualityAuditChecklist = z.infer<typeof qualityAuditChecklistSchema>;

// Quality Audit Result
export const qualityAuditResultSchema = z.object({
  stepId: z.string(),
  status: auditStepStatusSchema,
  startedAt: z.string(),
  finishedAt: z.string(),
  exitCode: z.number().nullable(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  notes: z.string().optional(),
});
export type QualityAuditResult = z.infer<typeof qualityAuditResultSchema>;

// Dependency Advisory Type
export const dependencyAdvisoryTypeSchema = z.enum(["outdated", "vulnerability"]);
export type DependencyAdvisoryType = z.infer<typeof dependencyAdvisoryTypeSchema>;

// Dependency Advisory Severity
export const dependencyAdvisorySeveritySchema = z.enum(["low", "moderate", "high", "critical", "info"]);
export type DependencyAdvisorySeverity = z.infer<typeof dependencyAdvisorySeveritySchema>;

// Dependency Advisory
export const dependencyAdvisorySchema = z.object({
  package: z.string(),
  currentVersion: z.string(),
  latestVersion: z.string(),
  severity: dependencyAdvisorySeveritySchema,
  type: dependencyAdvisoryTypeSchema,
  advisoryUrl: z.string().optional(),
});
export type DependencyAdvisory = z.infer<typeof dependencyAdvisorySchema>;

// Quality Audit Run Status
export const auditRunStatusSchema = z.enum(["passed", "failed"]);
export type AuditRunStatus = z.infer<typeof auditRunStatusSchema>;

// Quality Audit Run
export const qualityAuditRunSchema = z.object({
  id: z.string(),
  startedAt: z.string(),
  finishedAt: z.string(),
  runner: z.enum(["local", "ci"]),
  steps: z.array(qualityAuditResultSchema),
  status: auditRunStatusSchema,
  reportPath: z.string(),
  dependencies: z.array(dependencyAdvisorySchema).optional(),
});
export type QualityAuditRun = z.infer<typeof qualityAuditRunSchema>;
