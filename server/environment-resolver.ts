import type { Environment } from "@shared/schema";
import { storage } from "./storage";

export interface ResolveContext {
  requestId: string;
  environmentId?: string;
}

/**
 * Resolves environment variables with scoping hierarchy:
 * 1. Collection-scoped variables (highest priority)
 * 2. Workspace-scoped variables
 * 3. Global variables (lowest priority)
 */
export async function resolveEnvironmentVariable(
  key: string,
  context: ResolveContext,
  environment?: Environment
): Promise<string | undefined> {
  if (!environment) return undefined;

  const request = await storage.getRequest(context.requestId);
  if (!request) return undefined;

  const folder = await storage.getFolder(request.folderId);
  if (!folder) return undefined;

  const collection = await storage.getCollection(folder.collectionId);
  if (!collection) return undefined;

  // Try to find the variable in priority order
  // 1. Collection-scoped variable
  const collectionVar = environment.variables.find(
    v => v.key === key && 
         v.enabled && 
         v.scope === "collection" && 
         v.scopeId === collection.id
  );
  if (collectionVar) return collectionVar.value;

  // 2. Workspace-scoped variable
  const workspaceVar = environment.variables.find(
    v => v.key === key && 
         v.enabled && 
         v.scope === "workspace" && 
         v.scopeId === collection.workspaceId
  );
  if (workspaceVar) return workspaceVar.value;

  // 3. Global variable
  const globalVar = environment.variables.find(
    v => v.key === key && 
         v.enabled && 
         v.scope === "global"
  );
  if (globalVar) return globalVar.value;

  return undefined;
}

/**
 * Replaces all {{variable}} placeholders in a string with their resolved values
 */
export async function substituteVariables(
  text: string,
  context: ResolveContext,
  environment?: Environment
): Promise<string> {
  if (!text || !environment) return text;

  // Match all {{variable}} patterns
  const variablePattern = /\{\{([^}]+)\}\}/g;
  const matches = Array.from(text.matchAll(variablePattern));

  let result = text;
  for (const match of matches) {
    const variableName = match[1].trim();
    const value = await resolveEnvironmentVariable(variableName, context, environment);
    
    if (value !== undefined) {
      result = result.replace(match[0], value);
    }
  }

  return result;
}
