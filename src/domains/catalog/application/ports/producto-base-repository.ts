import type { ProductoBase } from "@/domains/catalog/domain/producto-base";

export interface ProductoBaseRepository {
  /** Toda la lista base (unos cientos), ordenada por categoría y nombre. */
  listar(): Promise<ProductoBase[]>;
  findById(id: string): Promise<ProductoBase | null>;
  /** El producto con ese nombre normalizado o con ese sinónimo. */
  buscarPorNombre(nombreNormalizado: string): Promise<ProductoBase | null>;
}
