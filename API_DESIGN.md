# API Testing Platform - API Design Document

## Overview
This document describes the REST API endpoints for the API Testing Platform. All endpoints are prefixed with `/api` and return JSON responses.

## Data Models

### Collection
```typescript
{
  id: string;
  name: string;
  description?: string;
  folders: Folder[];
  createdAt: string;
  updatedAt: string;
}
```

### Folder
```typescript
{
  id: string;
  name: string;
  collectionId: string;
  parentId?: string;  // null for root folders
  requests: Request[];
}
```

### Request
```typescript
{
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  folderId: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body?: {
    type: "json" | "form" | "raw";
    content: string;
  };
  auth?: {
    type: "bearer" | "basic" | "apikey";
    token?: string;
    username?: string;
    password?: string;
    key?: string;
    value?: string;
  };
}
```

### Environment
```typescript
{
  id: string;
  name: string;
  variables: EnvironmentVariable[];
  createdAt: string;
  updatedAt: string;
}
```

### EnvironmentVariable
```typescript
{
  key: string;
  value: string;
  enabled: boolean;
}
```

### Workflow
```typescript
{
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}
```

### WorkflowStep
```typescript
{
  id: string;
  order: number;
  requestId: string;
  extractVariables?: VariableExtraction[];
  assertions?: Assertion[];
}
```

### VariableExtraction
```typescript
{
  name: string;
  source: "body" | "headers" | "status";
  path: string;  // JSONPath for body, header name for headers
}
```

### Assertion
```typescript
{
  type: "status" | "body" | "header" | "time";
  operator: "equals" | "contains" | "lessThan" | "greaterThan";
  expected: string | number;
  actual?: string | number;
  passed?: boolean;
}
```

### ExecutionResult
```typescript
{
  id: string;
  requestId: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  time: number;  // milliseconds
  size: number;  // bytes
  timestamp: string;
}
```

## API Endpoints

### Collections

#### GET /api/collections
Get all collections.

**Response:**
```json
{
  "collections": [Collection]
}
```

#### POST /api/collections
Create a new collection.

**Request Body:**
```json
{
  "name": "string",
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "collection": Collection
}
```

#### GET /api/collections/:id
Get a specific collection by ID.

**Response:**
```json
{
  "collection": Collection
}
```

#### PUT /api/collections/:id
Update a collection.

**Request Body:**
```json
{
  "name": "string",
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "collection": Collection
}
```

#### DELETE /api/collections/:id
Delete a collection.

**Response:**
```json
{
  "success": true
}
```

#### POST /api/collections/import
Import a collection from OpenAPI specification.

**Request Body:**
```json
{
  "url": "string (optional)",
  "spec": "object (optional - OpenAPI JSON)"
}
```

**Response:**
```json
{
  "collection": Collection
}
```

### Folders

#### POST /api/folders
Create a new folder.

**Request Body:**
```json
{
  "name": "string",
  "collectionId": "string",
  "parentId": "string (optional)"
}
```

**Response:**
```json
{
  "folder": Folder
}
```

#### PUT /api/folders/:id
Update a folder.

**Request Body:**
```json
{
  "name": "string"
}
```

**Response:**
```json
{
  "folder": Folder
}
```

#### DELETE /api/folders/:id
Delete a folder and all its contents.

**Response:**
```json
{
  "success": true
}
```

### Requests

#### POST /api/requests
Create a new request.

**Request Body:**
```json
{
  "name": "string",
  "method": "GET | POST | PUT | DELETE | PATCH",
  "url": "string",
  "folderId": "string",
  "headers": KeyValuePair[],
  "params": KeyValuePair[],
  "body": object (optional),
  "auth": object (optional)
}
```

**Response:**
```json
{
  "request": Request
}
```

#### GET /api/requests/:id
Get a specific request.

**Response:**
```json
{
  "request": Request
}
```

#### PUT /api/requests/:id
Update a request.

**Request Body:** Same as POST /api/requests

**Response:**
```json
{
  "request": Request
}
```

#### DELETE /api/requests/:id
Delete a request.

**Response:**
```json
{
  "success": true
}
```

#### POST /api/requests/:id/execute
Execute a request.

**Request Body:**
```json
{
  "environmentId": "string (optional)"
}
```

**Response:**
```json
{
  "result": ExecutionResult
}
```

### Environments

#### GET /api/environments
Get all environments.

**Response:**
```json
{
  "environments": [Environment]
}
```

#### POST /api/environments
Create a new environment.

**Request Body:**
```json
{
  "name": "string",
  "variables": EnvironmentVariable[]
}
```

**Response:**
```json
{
  "environment": Environment
}
```

#### GET /api/environments/:id
Get a specific environment.

**Response:**
```json
{
  "environment": Environment
}
```

#### PUT /api/environments/:id
Update an environment.

**Request Body:**
```json
{
  "name": "string",
  "variables": EnvironmentVariable[]
}
```

**Response:**
```json
{
  "environment": Environment
}
```

#### DELETE /api/environments/:id
Delete an environment.

**Response:**
```json
{
  "success": true
}
```

### Workflows

#### GET /api/workflows
Get all workflows.

**Response:**
```json
{
  "workflows": [Workflow]
}
```

#### POST /api/workflows
Create a new workflow.

**Request Body:**
```json
{
  "name": "string",
  "description": "string (optional)",
  "steps": WorkflowStep[]
}
```

**Response:**
```json
{
  "workflow": Workflow
}
```

#### GET /api/workflows/:id
Get a specific workflow.

**Response:**
```json
{
  "workflow": Workflow
}
```

#### PUT /api/workflows/:id
Update a workflow.

**Request Body:** Same as POST /api/workflows

**Response:**
```json
{
  "workflow": Workflow
}
```

#### DELETE /api/workflows/:id
Delete a workflow.

**Response:**
```json
{
  "success": true
}
```

#### POST /api/workflows/:id/execute
Execute a workflow.

**Request Body:**
```json
{
  "environmentId": "string (optional)"
}
```

**Response:**
```json
{
  "results": {
    "steps": ExecutionResult[],
    "passed": boolean,
    "failedAssertions": Assertion[]
  }
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {} (optional)
}
```

### Common HTTP Status Codes
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Notes

1. All timestamps are in ISO 8601 format
2. IDs are UUIDs (v4)
3. The mock implementation stores data in memory and will be reset on server restart
4. Variable substitution uses `{{variableName}}` syntax in URLs, headers, and body
5. JSONPath is used for extracting values from response bodies
