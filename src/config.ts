import dotenv from 'dotenv'; 
dotenv.config(); 
import type { MigrationConfig } from "drizzle-orm/migrator";

export type APIConfig = {
  fileserverHits: number;
  port: number;
};

export type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};

export type Config={
  api:APIConfig,
  db:DBConfig
}
const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/lib/db/generated",
};

export const config:Config = {
  api: {
    fileserverHits: 0,
    port: Number(process.env.PORT),
    PLATFORM:process.env.PLATFORM??"",
    JWT_Secret:process.env.JWT_Secret??"",
    POLKA_KEY:process.env.POLKA_KEY??"",
  },

  db: {
    url: process.env.DB_URL!,
    migrationConfig,
  },
};