import { readFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const envFile = join(process.cwd(), ".env.local");
  const lines = readFileSync(envFile, "utf8").split(/\r?\n/);
  const databaseUrlLine = lines.find((line) => line.trimStart().startsWith("DATABASE_URL="));

  if (!databaseUrlLine) {
    throw new Error("DATABASE_URL is required. Add it to .env.local before running migrations.");
  }

  const value = databaseUrlLine.slice(databaseUrlLine.indexOf("=") + 1).trim();
  return value.replace(/^([\"'])(.*)\1$/, "$2");
}

const sql = neon(getDatabaseUrl());
const db = drizzle({ client: sql });

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Database migrations completed.");
