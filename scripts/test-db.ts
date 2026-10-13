/**
 * Comprobaciones de la base de datos de tests de integración.
 * La usan `vitest.integration.config.ts` y `scripts/migrate-test-db.ts`.
 */

/** Endpoint de Neon de una URL, sin el sufijo `-pooler` (pooled y directa son el mismo). */
function endpoint(url: string): string {
  return new URL(url).hostname.replace("-pooler.", ".");
}

/**
 * Lanza un error si la URL de test falta o apunta a la misma base de datos que la app
 * (`DATABASE_URL`/`DATABASE_URL_UNPOOLED` de `.env.local`): los tests crean y borran datos.
 */
export function urlDeTest(nombre: "TEST_DATABASE_URL" | "TEST_DATABASE_URL_UNPOOLED"): string {
  const url = process.env[nombre];
  if (!url) {
    throw new Error(
      `Falta ${nombre}. Ponla en .env.local (local) o en los secretos del repo (CI): ` +
        "una rama de Neon SOLO para tests.",
    );
  }

  const deLaApp = [process.env.DATABASE_URL, process.env.DATABASE_URL_UNPOOLED]
    .filter((u): u is string => typeof u === "string" && URL.canParse(u))
    .map(endpoint);

  if (deLaApp.includes(endpoint(url))) {
    throw new Error(
      `${nombre} apunta a la misma rama de Neon que la app. Usa una rama distinta, solo para tests.`,
    );
  }

  return url;
}
