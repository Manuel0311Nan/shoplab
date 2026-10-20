import { createHash } from "node:crypto";
import type { PrismaClient } from "../src/generated/prisma/client";
import { LISTA_BASE } from "../src/domains/catalog/infrastructure/lista-base.data";
import {
  cargarBiblioteca,
  problemasDeBiblioteca,
  type RecetaBiblioteca,
} from "../src/domains/recipes/infrastructure/biblioteca/biblioteca";
import { normalizarNombre } from "../src/shared/kernel/texto";
import { uuidV5 } from "./seed-lista-base";

/** Espacio de nombres fijo: cada receta tiene el mismo id en todas las BD. */
const NAMESPACE_RECETAS = "3b8e6c1d-2f4a-5b7c-8d9e-0a1b2c3d4e5f";

/**
 * Carga la biblioteca de recetas (los lotes JSON) en la BD. Idempotente:
 * - receta nueva → se crea; receta cuyo contenido cambió (huella) → se reescribe;
 * - receta que ya no está en ningún lote → se borra (la biblioteca manda).
 * Sin una transacción larga (Neon): pocas consultas por lotes y una pequeña por
 * receta cambiada.
 */
export async function sembrarRecetas(
  prisma: PrismaClient,
  recetas: readonly RecetaBiblioteca[] = cargarBiblioteca(),
): Promise<number> {
  const problemas = problemasDeBiblioteca(
    recetas,
    LISTA_BASE.map(([nombre]) => nombre),
  );
  if (problemas.length > 0) {
    throw new Error(`La biblioteca de recetas tiene problemas:\n- ${problemas.join("\n- ")}`);
  }

  const existentes = new Map(
    (await prisma.receta.findMany({ select: { slug: true, huella: true } })).map((r) => [
      r.slug,
      r.huella,
    ]),
  );

  const nuevas = recetas.filter((r) => !existentes.has(r.slug));
  const cambiadas = recetas.filter((r) => {
    const huella = existentes.get(r.slug);
    return huella !== undefined && huella !== huellaDe(r);
  });
  const slugs = new Set(recetas.map((r) => r.slug));
  const sobrantes = [...existentes.keys()].filter((slug) => !slugs.has(slug));

  if (nuevas.length > 0) {
    await prisma.receta.createMany({ data: nuevas.map(filaReceta), skipDuplicates: true });
    await prisma.recetaIngrediente.createMany({
      data: nuevas.flatMap(filasIngredientes),
      skipDuplicates: true,
    });
  }
  for (const receta of cambiadas) {
    const { id, ...datos } = filaReceta(receta);
    await prisma.$transaction([
      prisma.recetaIngrediente.deleteMany({ where: { recetaId: id } }),
      prisma.receta.update({ where: { id }, data: datos }),
      prisma.recetaIngrediente.createMany({ data: filasIngredientes(receta) }),
    ]);
  }
  if (sobrantes.length > 0) {
    // Los ingredientes se van con la receta (onDelete: Cascade).
    await prisma.receta.deleteMany({ where: { slug: { in: sobrantes } } });
  }

  console.log(
    `Recetas: ${nuevas.length} nuevas, ${cambiadas.length} actualizadas, ${sobrantes.length} borradas, ${recetas.length} en total`,
  );
  return recetas.length;
}

export function recetaId(slug: string): string {
  return uuidV5(slug, NAMESPACE_RECETAS);
}

function filaReceta(receta: RecetaBiblioteca) {
  return {
    id: recetaId(receta.slug),
    slug: receta.slug,
    nombre: receta.nombre,
    descripcion: receta.descripcion,
    raciones: receta.raciones,
    minutos: receta.minutos,
    etiquetas: receta.etiquetas,
    pasos: receta.pasos,
    huella: huellaDe(receta),
  };
}

function filasIngredientes(receta: RecetaBiblioteca) {
  const id = recetaId(receta.slug);
  return receta.ingredientes.map((ingrediente, orden) => ({
    id: uuidV5(`${receta.slug}#${orden}`, NAMESPACE_RECETAS),
    recetaId: id,
    orden,
    nombre: ingrediente.nombre,
    // Mismo id que les da seed-lista-base: UUID v5 del nombre normalizado.
    productosBaseIds: ingrediente.productos.map((p) => uuidV5(normalizarNombre(p))),
    cantidadValor: ingrediente.cantidad?.valor ?? null,
    cantidadUnidad: ingrediente.cantidad?.unidad ?? null,
    nota: ingrediente.nota ?? null,
    basico: ingrediente.basico,
    opcional: ingrediente.opcional,
  }));
}

function huellaDe(receta: RecetaBiblioteca): string {
  return createHash("sha1").update(JSON.stringify(receta)).digest("hex");
}
