# API Testing Platform

A modern REST API testing platform inspired by Postman, built with React, TypeScript, and Express.

## Overview

This is a full-featured API testing tool that allows developers to:
- Organize API requests in collections and folders
- Test HTTP endpoints with different methods (GET, POST, PUT, DELETE, PATCH)
- Manage multiple environments (Dev, Test, Prod)
- Execute API requests and view responses
- Support for OpenAPI JSON import (planned)
- Multi-step workflow execution (planned)

## Current State

✅ **Completed Features:**
- Modern dark-mode UI with Postman-inspired design
- Three-panel layout: Collections sidebar, Request builder, Response viewer
- Complete data models for Collections, Folders, Requests, Environments, and Workflows
- Full CRUD API with in-memory storage (MemStorage)
- Collection tree navigation with expandable folders
- Request builder with method selector, URL input, headers, params, body, and auth tabs
- Environment selector with variable support
- Response viewer with status codes, timing, and formatted JSON
- Color-coded HTTP method badges (GET: green, POST: blue, PUT: amber, DELETE: red, PATCH: purple)
- Cascade deletion for maintaining referential integrity
- Basic validation to prevent orphaned entities

## Project Architecture

### Frontend (`client/src/`)
- **Pages:**
  - `Home.tsx` - Main application page with three-panel layout
  - `NotFound.tsx` - 404 page

- **Components:**
  - `AppSidebar.tsx` - Left sidebar with collections tree
  - `CollectionItem.tsx` - Tree item for collections, folders, and requests
  - `RequestBuilder.tsx` - Center panel for building HTTP requests
  - `ResponseViewer.tsx` - Right panel for viewing API responses
  - `EnvironmentSelector.tsx` - Dropdown for switching environments
  - `HttpMethodBadge.tsx` - Color-coded HTTP method indicator
  - `StatusCodeBadge.tsx` - Color-coded status code indicator
  - `KeyValueTable.tsx` - Reusable table for headers/params
  - `ImportDialog.tsx` - Dialog for OpenAPI import (UI only)
  - `ThemeToggle.tsx` - Dark/light mode switcher

### Backend (`server/`)
- **Storage:** `storage.ts` - In-memory storage with MemStorage class
- **Routes:** `routes.ts` - RESTful API endpoints
- **API Design:** `API_DESIGN.md` - Complete API documentation

### Shared (`shared/`)
- **Schema:** `schema.ts` - TypeScript types and Zod schemas for all data models

## Data Models

1. **Collection** - Top-level container for API requests
   - Contains multiple folders
   - Has name, description, timestamps

2. **Folder** - Organizes requests within a collection
   - Belongs to one collection
   - Contains multiple requests

3. **Request** - Individual API request
   - HTTP method, URL, headers, params, body, auth
   - Belongs to one folder

4. **Environment** - Set of variables (Dev/Test/Prod)
   - Key-value pairs with enabled/disabled state
   - Used for variable substitution in requests

5. **Workflow** - Multi-step request sequences (schema defined, not yet implemented)

6. **ExecutionResult** - Stored response from API execution

## API Endpoints

### Collections
- `GET /api/collections` - List all collections (with hydrated folders/requests)
- `GET /api/collections/:id` - Get single collection
- `POST /api/collections` - Create collection
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
- `POST /api/environments` - Create environment
- `PATCH /api/environments/:id` - Update environment
- `DELETE /api/environments/:id` - Delete environment

### Workflows (planned)
- Full CRUD endpoints defined but not yet connected to UI

## Storage System

The application uses in-memory storage (`MemStorage` class) with:
- **Hydration:** Collections automatically include nested folders and requests
- **Cascade Deletion:** Deleting a collection removes all folders, requests, and execution results
- **Validation:** Prevents orphaned entities (requests without folders, folders without collections)
- **Mock Data:** Initializes with sample "User Management API" collection

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

**October 20, 2025:**
- Implemented data hydration system for collections (folders and requests now properly nested)
- Added cascade deletion for collections, folders, and requests
- Added validation to prevent orphaned entities
- Fixed request builder to properly update when selecting different requests
- Connected frontend to backend API with working data flow
- All end-to-end tests passing

## Next Steps (Future Enhancements)

1. **OpenAPI Import:** Complete the import dialog functionality to parse and create collections from OpenAPI JSON
2. **Workflow Execution:** Implement multi-step request sequences with variable chaining
3. **Request Execution:** Connect to actual HTTP endpoints (currently mock execution)
4. **Environment Variables:** Implement {{variable}} substitution in requests
5. **Advanced Validation:** Cross-collection validation, workflow cleanup
6. **Export/Save:** Allow exporting collections and environments as JSON files
7. **History:** Track execution history for debugging
8. **Versioning:** Support multiple versions of API collections

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
