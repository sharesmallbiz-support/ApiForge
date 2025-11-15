import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const collections = sqliteTable("collections", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const folders = sqliteTable("folders", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  collectionId: text("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
});

export const requests = sqliteTable("requests", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  method: text("method").notNull(),
  url: text("url").notNull(),
  folderId: text("folder_id").notNull().references(() => folders.id, { onDelete: "cascade" }),
  headers: text("headers").notNull().default("[]"), // JSON string
  params: text("params").notNull().default("[]"), // JSON string
  body: text("body"), // JSON string with type and content
  auth: text("auth"), // JSON string
  script: text("script"),
});

export const environments = sqliteTable("environments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  variables: text("variables").notNull().default("[]"), // JSON string
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workflows = sqliteTable("workflows", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  steps: text("steps").notNull().default("[]"), // JSON string
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const executionResults = sqliteTable("execution_results", {
  id: text("id").primaryKey(),
  requestId: text("request_id").notNull().references(() => requests.id, { onDelete: "cascade" }),
  status: integer("status").notNull(),
  statusText: text("status_text").notNull(),
  headers: text("headers").notNull().default("{}"), // JSON string
  body: text("body"),
  time: integer("time").notNull(),
  size: integer("size").notNull(),
  timestamp: text("timestamp").notNull().default(sql`CURRENT_TIMESTAMP`),
});
