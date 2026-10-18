import type { ProductoBase } from "@/domains/catalog/domain/producto-base";

export interface ProductoBaseRepository {
  /** Toda la lista base (unos cientos), ordenada por categoría y nombre. */
  listar(): Promise<ProductoBase[]>;
}
