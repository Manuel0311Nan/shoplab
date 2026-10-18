import type { ProductoBaseRepository } from "@/domains/catalog/application/ports/producto-base-repository";
import { compararProductos, type ProductoBase } from "@/domains/catalog/domain/producto-base";

export class InMemoryProductoBaseRepository implements ProductoBaseRepository {
  constructor(private readonly productos: readonly ProductoBase[] = []) {}

  async listar(): Promise<ProductoBase[]> {
    return [...this.productos].sort(compararProductos);
  }
}
