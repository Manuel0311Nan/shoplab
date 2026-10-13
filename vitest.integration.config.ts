import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import { defineConfig } from "vitest/config";

// Lee .env.local, igual que prisma.config.ts.
nextEnv.loadEnvConfig(process.cwd());

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    "Define TEST_DATABASE_URL en .env.local: la URL de una rama de Neon SOLO para tests " +
      "(los tests crean y borran datos).",
  );
}

/**
 * Tests de integración: repositorios contra una base de datos real.
 * `pnpm test:integration`. No forman parte de `pnpm test` ni de la CI (de momento).
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
      DATABASE_URL_UNPOOLED: testDatabaseUrl,
    },
  },
});
