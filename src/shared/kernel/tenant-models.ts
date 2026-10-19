import type { Prisma } from "@/generated/prisma/client";

/**
 * Modelos que pertenecen a un hogar: la extensión `tenant-prisma` les inyecta
 * `hogarId` en toda consulta. Todo modelo con columna `hogarId` DEBE estar aquí
 * o en `TENANT_EXCLUDED`, con el motivo (lo comprueba `tenant-models.test.ts`).
 *
 * Archivo aparte de `tenant-prisma.ts` (que es server-only) para poder testearlo.
 */
export const TENANT_MODELS: ReadonlySet<Prisma.ModelName> = new Set<Prisma.ModelName>([
  "ShoppingList",
  "ShoppingItem",
  "ProductoRecordado",
  "Ubicacion",
  "InventoryItem",
  "MovimientoDespensa",
]);

/** Modelos con `hogarId` que NO se filtran automáticamente, y por qué. */
export const TENANT_EXCLUDED: Readonly<Partial<Record<Prisma.ModelName, string>>> = {
  MiembroHogar:
    "Relaciona usuarios con hogares: hay que consultarla entre hogares (p. ej. «¿de qué hogares soy miembro?»).",
};
