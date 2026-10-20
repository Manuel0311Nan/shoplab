import "server-only";
import type { RecetaRepository } from "@/domains/recipes/application/ports/receta-repository";
import type {
  IngredienteReceta,
  ProductoAlternativo,
  Receta,
} from "@/domains/recipes/domain/receta";
import type { Prisma } from "@/generated/prisma/client";
import { Cantidad } from "@/shared/kernel/cantidad";
import { prisma } from "@/shared/kernel/prisma";

const INCLUDE = { ingredientes: { orderBy: { orden: "asc" } } } as const;
type Fila = Prisma.RecetaGetPayload<{ include: typeof INCLUDE }>;

/** Tablas globales (sin hogarId): usa el cliente base, no el de tenant. */
export class PrismaRecetaRepository implements RecetaRepository {
  async listar(): Promise<Receta[]> {
    const filas = await prisma.receta.findMany({ include: INCLUDE, orderBy: { nombre: "asc" } });
    const productos = await productosDe(filas);
    return filas.map((f) => toDomain(f, productos));
  }

  async findById(id: string): Promise<Receta | null> {
    const fila = await prisma.receta.findUnique({ where: { id }, include: INCLUDE });
    if (fila === null) return null;
    return toDomain(fila, await productosDe([fila]));
  }
}

/** Nombres de los productos de la lista base que usan las recetas: hacen falta para cruzar por nombre. */
async function productosDe(filas: readonly Fila[]): Promise<Map<string, ProductoAlternativo>> {
  const ids = [...new Set(filas.flatMap((f) => f.ingredientes.flatMap((i) => i.productosBaseIds)))];
  if (ids.length === 0) return new Map();
  const productos = await prisma.productoBase.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombre: true, nombreNormalizado: true },
  });
  return new Map(productos.map((p) => [p.id, p]));
}

function toDomain(fila: Fila, productos: ReadonlyMap<string, ProductoAlternativo>): Receta {
  return {
    id: fila.id,
    slug: fila.slug,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    raciones: fila.raciones,
    minutos: fila.minutos,
    etiquetas: fila.etiquetas,
    pasos: fila.pasos,
    ingredientes: fila.ingredientes.map((i): IngredienteReceta => ({
      nombre: i.nombre,
      // Un id que ya no está en la lista base se ignora: el ingrediente queda sin ese producto.
      productos: i.productosBaseIds.flatMap((id) => {
        const p = productos.get(id);
        return p === undefined ? [] : [p];
      }),
      cantidad: cantidadDe(i.cantidadValor, i.cantidadUnidad),
      nota: i.nota,
      basico: i.basico,
      opcional: i.opcional,
    })),
  };
}

function cantidadDe(valor: Prisma.Decimal | null, unidad: string | null): Cantidad | null {
  if (valor === null || unidad === null) return null;
  const r = Cantidad.create(valor.toNumber(), unidad);
  return r.ok ? r.value : null;
}
