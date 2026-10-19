import { createHash } from "node:crypto";
import type { PrismaClient } from "../src/generated/prisma/client";
import { LISTA_BASE, SINONIMOS } from "../src/domains/catalog/infrastructure/lista-base.data";
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
 * Carga la lista base. Idempotente: la clave es el nombre normalizado, así que volver a
 * sembrar no duplica ni cambia ids (los ítems que ya apuntan a un producto siguen
 * apuntando a él).
 *
 * Sin una transacción con 328 upserts: contra Neon cada consulta es un viaje de red y
 * se pasaba del límite de 5 s de Prisma. En su lugar: una lectura, un createMany con
 * los nuevos y un update solo por cada producto que haya cambiado (normalmente ninguno).
 */
export async function sembrarListaBase(prisma: PrismaClient): Promise<number> {
  const existentes = new Map(
    (
      await prisma.productoBase.findMany({
        select: {
          nombreNormalizado: true,
          nombre: true,
          categoria: true,
          unidadPorDefecto: true,
          sinonimos: true,
        },
      })
    ).map((p) => [p.nombreNormalizado, p]),
  );

  const nuevos = [];
  const cambiados = [];
  for (const [nombre, categoria, unidad] of LISTA_BASE) {
    const nombreNormalizado = normalizarNombre(nombre);
    const sinonimos = (SINONIMOS[nombre] ?? []).map(normalizarNombre);
    const actual = existentes.get(nombreNormalizado);
    if (actual === undefined) {
      nuevos.push({
        id: uuidV5(nombreNormalizado),
        nombre,
        nombreNormalizado,
        categoria,
        unidadPorDefecto: unidad,
        sinonimos,
      });
    } else if (
      actual.nombre !== nombre ||
      actual.categoria !== categoria ||
      actual.unidadPorDefecto !== unidad ||
      actual.sinonimos.join("|") !== sinonimos.join("|")
    ) {
      cambiados.push({ nombreNormalizado, nombre, categoria, unidadPorDefecto: unidad, sinonimos });
    }
  }

  // skipDuplicates: si otro seed corre a la vez, no falla por la clave única.
  if (nuevos.length > 0)
    await prisma.productoBase.createMany({ data: nuevos, skipDuplicates: true });
  for (const { nombreNormalizado, ...datos } of cambiados) {
    await prisma.productoBase.update({ where: { nombreNormalizado }, data: datos });
  }

  console.log(
    `Lista base: ${nuevos.length} nuevos, ${cambiados.length} actualizados, ${LISTA_BASE.length} en total`,
  );
  return LISTA_BASE.length;
}
