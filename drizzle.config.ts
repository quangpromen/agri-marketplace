import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "drizzle-kit";

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const envFile = join(process.cwd(), ".env.local");
  const lines = readFileSync(envFile, "utf8").split(/\r?\n/);
  const databaseUrlLine = lines.find((line) => line.trimStart().startsWith("DATABASE_URL="));

  if (!databaseUrlLine) {
    throw new Error(
      "DATABASE_URL is required. Add it to .env.local before running Drizzle commands."
    );
  }

  const value = databaseUrlLine.slice(databaseUrlLine.indexOf("=") + 1).trim();
  return value.replace(/^([\"'])(.*)\1$/, "$2");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
