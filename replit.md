# API Testing Platform

A modern REST API testing platform inspired by Postman, built with React, TypeScript, and Express.

## Overview

This is a full-featured API testing tool that allows developers to:
- Organize API requests in workspaces, collections, and folders
- Test HTTP endpoints with different methods (GET, POST, PUT, DELETE, PATCH)
- Manage scoped environment variables (global, workspace, and collection levels)
- Execute API requests with variable substitution and view responses
- Post-request scripting for value extraction and environment updates
- Support for OpenAPI JSON import (planned)
- Multi-step workflow execution (planned)

## Current State

✅ **Completed Features:**
- Modern dark-mode UI with Postman-inspired design
- Three-panel layout: Collections sidebar, Request builder, Response viewer
- **Workspace Organization:** Application-level container above collections
- **Scoped Environment Variables:** Global, workspace, and collection-level scoping with hierarchical resolution
- Complete data models for Workspaces, Collections, Folders, Requests, Environments, and Workflows
- Full CRUD API with in-memory storage (MemStorage)
- Hierarchical tree navigation: Workspaces → Collections → Folders → Requests
- Request builder with method selector, URL input, headers, params, body, and auth tabs
- **Variable Substitution:** {{variableName}} syntax in URL, headers, params, and body
- **Post-Request Scripting:** JavaScript execution with pm.environment.set() API
- Environment editor with scope selection (global/workspace/collection)
- Response viewer with status codes, timing, formatted JSON, and resolved values
- Color-coded HTTP method badges (GET: green, POST: blue, PUT: amber, DELETE: red, PATCH: purple)
- Cascade deletion for maintaining referential integrity
- Validation to prevent orphaned entities and invalid scoping

## Project Architecture

### Frontend (`client/src/`)
- **Pages:**
  - `Home.tsx` - Main application page with three-panel layout
  - `NotFound.tsx` - 404 page

- **Components:**
  - `AppSidebar.tsx` - Left sidebar with workspaces → collections → folders → requests hierarchy
  - `CollectionItem.tsx` - Tree item for workspaces, collections, folders, and requests
  - `RequestBuilder.tsx` - Center panel for building HTTP requests
  - `ResponseViewer.tsx` - Right panel for viewing API responses (includes resolved values)
  - `EnvironmentSelector.tsx` - Dropdown for switching environments
  - `EnvironmentEditor.tsx` - Dialog for managing scoped environment variables
  - `HttpMethodBadge.tsx` - Color-coded HTTP method indicator
  - `StatusCodeBadge.tsx` - Color-coded status code indicator
  - `KeyValueTable.tsx` - Reusable table for headers/params
  - `ImportDialog.tsx` - Dialog for OpenAPI import (UI only)
  - `ThemeToggle.tsx` - Dark/light mode switcher

### Backend (`server/`)
- **Storage:** `storage.ts` - In-memory storage with MemStorage class and workspace support
- **Routes:** `routes.ts` - RESTful API endpoints including workspace CRUD
- **Environment Resolver:** `environment-resolver.ts` - Scoped variable resolution with hierarchical precedence
- **Script Executor:** `script-executor.ts` - Post-request JavaScript execution engine
- **API Design:** `API_DESIGN.md` - Complete API documentation

### Shared (`shared/`)
- **Schema:** `schema.ts` - TypeScript types and Zod schemas for all data models

## Data Models

1. **Workspace** - Top-level application container
   - Contains multiple collections
   - Has name, description, timestamps
   - Enables application-level organization

2. **Collection** - Container for API requests within a workspace
   - Belongs to one workspace
   - Contains multiple folders
   - Has name, description, timestamps

3. **Folder** - Organizes requests within a collection
   - Belongs to one collection
   - Contains multiple requests

4. **Request** - Individual API request
   - HTTP method, URL, headers, params, body, auth
   - Belongs to one folder
   - Supports post-request scripts for environment updates

5. **Environment** - Set of variables with scoped visibility
   - **Scoping Levels:** Global (all workspaces), Workspace (specific workspace), Collection (specific collection)
   - **Variable Resolution:** Collection > Workspace > Global (hierarchical precedence)
   - Key-value pairs with enabled/disabled state
   - Used for {{variable}} substitution in requests

6. **Workflow** - Multi-step request sequences (schema defined, not yet implemented)

7. **ExecutionResult** - Stored response from API execution
   - Includes resolved URL, headers, params for verification

## API Endpoints

### Workspaces
- `GET /api/workspaces` - List all workspaces (with hydrated collections)
- `GET /api/workspaces/:id` - Get single workspace
- `POST /api/workspaces` - Create workspace
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace (cascades to collections/folders/requests)

### Collections
- `GET /api/collections` - List all collections (with hydrated folders/requests)
- `GET /api/collections/:id` - Get single collection
- `POST /api/collections` - Create collection (requires workspaceId)
- `PATCH /api/collections/:id` - Update collection
- `DELETE /api/collections/:id` - Delete collection (cascades to folders/requests)

### Folders
- `POST /api/folders` - Create folder
- `PATCH /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder (cascades to requests)

### Requests
- `GET /api/requests/:id` - Get request
- `POST /api/requests` - Create request
- `PATCH /api/requests/:id` - Update request
- `DELETE /api/requests/:id` - Delete request
- `POST /api/requests/:id/execute` - Execute request and return result

### Environments
- `GET /api/environments` - List all environments
- `GET /api/environments/:id` - Get environment
- `POST /api/environments` - Create environment with scope (global/workspace/collection)
- `PATCH /api/environments/:id` - Update environment
- `DELETE /api/environments/:id` - Delete environment

### Variable Resolution
The environment resolver implements hierarchical variable resolution:
1. **Collection-scoped variables** (highest priority) - visible only to requests in that collection
2. **Workspace-scoped variables** - visible to all collections in that workspace
3. **Global variables** (lowest priority) - visible to all workspaces

Variables are substituted using `{{variableName}}` syntax in:
- Request URLs
- Headers (keys and values)
- Query parameters (keys and values)
- Request body (JSON)

### Workflows (planned)
- Full CRUD endpoints defined but not yet connected to UI

## Storage System

The application uses in-memory storage (`MemStorage` class) with:
- **Hierarchical Hydration:** Workspaces include collections; collections include folders and requests
- **Cascade Deletion:** Deleting a workspace removes all collections, folders, requests, and execution results
- **Validation:** Prevents orphaned entities and invalid scoping (e.g., collection-scoped env without collectionId)
- **Mock Data:** Initializes with sample workspace containing "User Management API" collection
- **Scoped Environment Resolution:** Variables resolved based on request context (collection → workspace → global)

## Design System

- **Theme:** Dark mode primary with light mode support
- **Colors:** 
  - Primary: Blue for main actions
  - Accent: Used for highlights and secondary actions
  - Method-specific: Green (GET), Blue (POST), Amber (PUT), Red (DELETE), Purple (PATCH)
- **Layout:** Three-column responsive layout with sidebar, main content, and response panel
- **Typography:** System fonts optimized for readability
- **Icons:** Lucide React icons throughout

## User Preferences

- Dark mode as default theme
- Developer-focused aesthetics (Postman/Linear/VS Code inspired)
- Minimal, clean interface
- In-memory storage only (no database required)

## Recent Changes

**October 20, 2025 (Latest):**
- ✅ **Workspace Implementation:** Added Workspace entity as top-level container above collections
- ✅ **Scoped Environment Variables:** Implemented three-level scoping (global/workspace/collection) with hierarchical resolution
- ✅ **Variable Substitution:** Full {{variable}} support in URL, headers, params, and body
- ✅ **Post-Request Scripts:** JavaScript execution with pm.environment.set() API for value extraction
- ✅ **Environment Editor UI:** Scope selection with dynamic workspace/collection dropdowns
- ✅ **Hierarchical Sidebar:** Workspaces → Collections → Folders → Requests navigation
- ✅ **Resolved Values Display:** Response includes resolved URL, headers, params for verification
- ✅ **Storage Layer Updates:** Workspace CRUD, scoped resolution, proper hydration
- ✅ **API Routes:** Complete workspace endpoints, variable resolution in request execution

**October 20, 2025 (Earlier):**
- Implemented data hydration system for collections (folders and requests now properly nested)
- Added cascade deletion for collections, folders, and requests
- Added validation to prevent orphaned entities
- Fixed request builder to properly update when selecting different requests
- Connected frontend to backend API with working data flow
- All end-to-end tests passing

## Next Steps (Future Enhancements)

1. **OpenAPI Import:** Complete the import dialog functionality to parse and create collections from OpenAPI JSON (requires workspaceId parameter fix)
2. **Workflow Execution:** Implement multi-step request sequences with variable chaining between requests
3. **Real HTTP Execution:** Connect to actual HTTP endpoints (currently mock execution for safety)
4. **Query Params in URL:** Merge resolved params into final URL query string
5. **Advanced Validation:** Cross-collection validation, workflow cleanup
6. **Export/Save:** Allow exporting workspaces, collections, and environments as JSON files
7. **History:** Track execution history for debugging
8. **Versioning:** Support multiple versions of API collections
9. **Enhanced UI:** Display resolved values directly in RequestBuilder (currently in response headers)

## Running the Application

The application runs on port 5000 with both frontend and backend:

```bash
npm run dev
```

This starts:
- Express backend on port 5000
- Vite dev server for frontend (proxied through Express)

## Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Express, TypeScript
- **Data:** In-memory storage (no database)
- **Validation:** Zod schemas
- **State:** TanStack Query (React Query v5)
- **Routing:** wouter (client-side)
- **Icons:** Lucide React
