import type { ProductoRecordadoRepository } from "@/domains/catalog/application/ports/producto-recordado-repository";
import type { ProductoRecordado } from "@/domains/catalog/domain/producto-recordado";

export class InMemoryProductoRecordadoRepository implements ProductoRecordadoRepository {
  private readonly store = new Map<string, ProductoRecordado>();

  constructor(iniciales: readonly ProductoRecordado[] = []) {
    for (const p of iniciales) this.store.set(p.nombreNormalizado, p);
  }

  async buscar(nombreNormalizado: string): Promise<ProductoRecordado | null> {
    return this.store.get(nombreNormalizado) ?? null;
  }

  async listar(limite: number): Promise<ProductoRecordado[]> {
    return [...this.store.values()]
      .sort((a, b) => b.usos - a.usos || b.ultimoUso.getTime() - a.ultimoUso.getTime())
      .slice(0, limite);
  }

  async borrar(nombreNormalizado: string): Promise<void> {
    this.store.delete(nombreNormalizado);
  }

  async guardar(producto: ProductoRecordado): Promise<void> {
    this.store.set(producto.nombreNormalizado, producto);
  }
}
