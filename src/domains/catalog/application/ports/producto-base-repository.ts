import type { ProductoBase } from "@/domains/catalog/domain/producto-base";
import type { AvisoAbierto } from "@/shared/kernel/abierto";

export interface ProductoBaseRepository {
  /** Toda la lista base (unos cientos), ordenada por categoría y nombre. */
  listar(): Promise<ProductoBase[]>;
  findById(id: string): Promise<ProductoBase | null>;
  /** El producto con ese nombre normalizado o con ese sinónimo. */
  buscarPorNombre(nombreNormalizado: string): Promise<ProductoBase | null>;
  /** La excepción al aviso de «abierto» de su categoría, si el producto la tiene. */
  avisoAbierto(id: string): Promise<AvisoAbierto | null>;
}
