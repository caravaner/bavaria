import { defineConfig, env } from "@prisma/config";

// Migrations must use a direct (unpooled) connection — PgBouncer transaction
// pooling drops session-level state that the schema engine relies on
// (advisory locks, prepared statements during introspection, etc.).
// The running app uses DATABASE_URL (pooled) via lib/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
});
