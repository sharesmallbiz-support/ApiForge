import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./server/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/apiforge.db",
  },
});
