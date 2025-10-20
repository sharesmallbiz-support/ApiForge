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

// Environment Variable
export const environmentVariableSchema = z.object({
  key: z.string(),
  value: z.string(),
  enabled: z.boolean(),
});
export type EnvironmentVariable = z.infer<typeof environmentVariableSchema>;

// Environment
export const environmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  variables: z.array(environmentVariableSchema).default([]),
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
});
export type ExecutionResult = z.infer<typeof executionResultSchema>;

// OpenAPI Import
export const openApiImportSchema = z.object({
  url: z.string().optional(),
  spec: z.any().optional(),
});
export type OpenApiImport = z.infer<typeof openApiImportSchema>;
