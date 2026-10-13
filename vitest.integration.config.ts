import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import { defineConfig } from "vitest/config";
import { urlDeTest } from "./scripts/test-db";

// Lee .env.local, igual que prisma.config.ts.
nextEnv.loadEnvConfig(process.cwd());

// Falla si falta o si apunta a la base de datos de la app.
const testDatabaseUrl = urlDeTest("TEST_DATABASE_URL");

/**
 * Tests de integración: repositorios contra una base de datos real (rama de Neon de test).
 * Local: `pnpm db:migrate:test` (una vez por migración nueva) y `pnpm test:integration`.
 * CI: job `integration` de ci.yml, con los secretos TEST_DATABASE_URL(_UNPOOLED).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./test-utils/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    // Comparten la misma base de datos: uno detrás de otro.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: testDatabaseUrl,
      DATABASE_URL_UNPOOLED: process.env.TEST_DATABASE_URL_UNPOOLED ?? testDatabaseUrl,
    },
  },
});
