import "server-only";
import type { ProductoBaseRepository } from "@/domains/catalog/application/ports/producto-base-repository";
import { compararProductos, type ProductoBase } from "@/domains/catalog/domain/producto-base";
import { prisma } from "@/shared/kernel/prisma";

const SELECT = { id: true, nombre: true, categoria: true, unidadPorDefecto: true } as const;

/** Tabla global (sin hogarId): usa el cliente base, no el de tenant. */
export class PrismaProductoBaseRepository implements ProductoBaseRepository {
  async listar(): Promise<ProductoBase[]> {
    const filas = await prisma.productoBase.findMany({ select: SELECT });
    // El enum de Postgres ordena por declaración, pero se ordena aquí para no depender de ello.
    return filas.sort(compararProductos);
  }

  async findById(id: string): Promise<ProductoBase | null> {
    return prisma.productoBase.findUnique({ where: { id }, select: SELECT });
  }

  async buscarPorNombre(nombreNormalizado: string): Promise<ProductoBase | null> {
    // Primero el nombre exacto: si además es sinónimo de otro producto, gana el nombre.
    return (
      (await prisma.productoBase.findUnique({ where: { nombreNormalizado }, select: SELECT })) ??
      (await prisma.productoBase.findFirst({
        where: { sinonimos: { has: nombreNormalizado } },
        select: SELECT,
      }))
    );
  }
}
