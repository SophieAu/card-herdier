import { defineConfig } from "drizzle-kit";

const databaseUrl = `postgresql://${Deno.env.get("PGUSER")}:${
  Deno.env.get("PGPASSWORD")
}@${Deno.env.get("PGHOST")}:5432/${Deno.env.get("PGDATABASE")}`;

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: `${databaseUrl}?sslmode=require`,
    ssl: "require",
  },
});
