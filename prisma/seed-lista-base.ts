import { createHash } from "node:crypto";
import type { PrismaClient } from "../src/generated/prisma/client";
import { LISTA_BASE } from "../src/domains/catalog/infrastructure/lista-base.data";
import { normalizarNombre } from "../src/shared/kernel/texto";

/** Espacio de nombres fijo para que cada producto tenga el mismo id en todas las BD. */
const NAMESPACE_LISTA_BASE = "6f1c9e2a-4b7d-5e3f-9a8b-2c1d0e4f6a7b";

/** UUID v5 (RFC 9562): SHA-1 del namespace + nombre. */
export function uuidV5(nombre: string, namespace = NAMESPACE_LISTA_BASE): string {
  const ns = Buffer.from(namespace.replaceAll("-", ""), "hex");
  const hash = createHash("sha1").update(ns).update(nombre, "utf8").digest();
  hash[6] = ((hash[6] ?? 0) & 0x0f) | 0x50;
  hash[8] = ((hash[8] ?? 0) & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Carga la lista base. Idempotente: upsert por nombre normalizado, así que volver a
 * sembrar actualiza categoría y unidad sin duplicar ni cambiar ids (los ítems que ya
 * apuntan a un producto siguen apuntando a él).
 */
export async function sembrarListaBase(prisma: PrismaClient): Promise<number> {
  await prisma.$transaction(
    LISTA_BASE.map(([nombre, categoria, unidad]) => {
      const nombreNormalizado = normalizarNombre(nombre);
      return prisma.productoBase.upsert({
        where: { nombreNormalizado },
        update: { nombre, categoria, unidadPorDefecto: unidad },
        create: {
          id: uuidV5(nombreNormalizado),
          nombre,
          nombreNormalizado,
          categoria,
          unidadPorDefecto: unidad,
        },
      });
    }),
  );
  return LISTA_BASE.length;
}
