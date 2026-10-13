/**
 * Aplica las migraciones a la base de datos de tests de integración (nunca a la de la app).
 * Uso: `pnpm db:migrate:test`. Lo usa también la CI.
 */
import { spawnSync } from "node:child_process";
import nextEnv from "@next/env";
import { urlDeTest } from "./test-db";

nextEnv.loadEnvConfig(process.cwd());

const url = urlDeTest("TEST_DATABASE_URL_UNPOOLED");

// prisma.config.ts lee DATABASE_URL_UNPOOLED; loadEnvConfig no pisa una variable ya definida.
const result = spawnSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL_UNPOOLED: url },
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(`No se pudo ejecutar prisma: ${result.error.message}`);
}
process.exit(result.status ?? 1);
