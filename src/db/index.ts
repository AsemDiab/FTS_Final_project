import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.js";
import { config } from "../config.js";

const conn = postgres(config.db.url);
export const db = drizzle(conn, { schema });

import { sql } from "drizzle-orm";
export async function testConnection() {
  try {
    console.log("Testing database connection..." + config.db.url);
    const result = await db.execute(
      sql`SELECT current_database(), current_user`,
    );

    console.log("Database connection successful:", result.rows);
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}
