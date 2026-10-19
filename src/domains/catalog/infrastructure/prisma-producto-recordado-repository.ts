import "server-only";
import type { ProductoRecordadoRepository } from "@/domains/catalog/application/ports/producto-recordado-repository";
import type { ProductoRecordado } from "@/domains/catalog/domain/producto-recordado";
import { TenantRepository } from "@/shared/kernel/tenant-repository";

const SELECT = {
  nombreNormalizado: true,
  nombre: true,
  categoria: true,
  unidad: true,
  usos: true,
  ultimoUso: true,
} as const;

export class PrismaProductoRecordadoRepository
  extends TenantRepository
  implements ProductoRecordadoRepository
{
  async buscar(nombreNormalizado: string): Promise<ProductoRecordado | null> {
    return this.db.productoRecordado.findFirst({ where: { nombreNormalizado }, select: SELECT });
  }

  async listar(limite: number): Promise<ProductoRecordado[]> {
    return this.db.productoRecordado.findMany({
      orderBy: [{ usos: "desc" }, { ultimoUso: "desc" }],
      take: limite,
      select: SELECT,
    });
  }

  async guardar(producto: ProductoRecordado): Promise<void> {
    const { nombreNormalizado, ...datos } = producto;
    await this.db.productoRecordado.upsert({
      where: { hogarId_nombreNormalizado: { hogarId: this.hogarId, nombreNormalizado } },
      create: { ...producto, hogarId: this.hogarId },
      update: datos,
    });
  }
}
