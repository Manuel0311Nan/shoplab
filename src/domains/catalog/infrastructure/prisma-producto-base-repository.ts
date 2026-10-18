import "server-only";
import type { ProductoBaseRepository } from "@/domains/catalog/application/ports/producto-base-repository";
import { compararProductos, type ProductoBase } from "@/domains/catalog/domain/producto-base";
import { prisma } from "@/shared/kernel/prisma";

/** Tabla global (sin hogarId): usa el cliente base, no el de tenant. */
export class PrismaProductoBaseRepository implements ProductoBaseRepository {
  async listar(): Promise<ProductoBase[]> {
    const filas = await prisma.productoBase.findMany({
      select: { id: true, nombre: true, categoria: true, unidadPorDefecto: true },
    });
    // El enum de Postgres ordena por declaración, pero se ordena aquí para no depender de ello.
    return filas.sort(compararProductos);
  }
}
