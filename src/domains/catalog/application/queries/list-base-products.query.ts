import type { ProductoBase } from "@/domains/catalog/domain/producto-base";
import { ok, type Result } from "@/shared/kernel/result";
import type { ProductoBaseRepository } from "../ports/producto-base-repository";

/**
 * La lista base completa. Se descarga una vez y se filtra en el cliente: son unos
 * cientos de filas y así el autocompletado responde sin red a cada tecla.
 */
export class ListBaseProductsQuery {
  constructor(private readonly productos: ProductoBaseRepository) {}

  async execute(): Promise<Result<ProductoBase[]>> {
    return ok(await this.productos.listar());
  }
}
