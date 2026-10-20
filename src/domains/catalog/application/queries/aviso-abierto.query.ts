import { type AvisoAbierto, AVISO_ABIERTO_POR_CATEGORIA } from "@/shared/kernel/abierto";
import type { Categoria } from "@/shared/kernel/categoria";
import { ok, type Result } from "@/shared/kernel/result";
import type { ProductoBaseRepository } from "../ports/producto-base-repository";

export interface AvisoAbiertoInput {
  readonly productoBaseId: string | null;
  readonly categoria: Categoria;
}

/**
 * Cuántos días puede estar abierto un producto antes de avisar: la excepción del
 * producto en la lista base o, si no tiene (o es texto libre), la de su categoría.
 * null: no se «abre» (fruta, verdura, limpieza…).
 */
export class AvisoAbiertoQuery {
  constructor(private readonly productos: ProductoBaseRepository) {}

  async execute(input: AvisoAbiertoInput): Promise<Result<AvisoAbierto | null>> {
    const propio =
      input.productoBaseId === null
        ? null
        : await this.productos.avisoAbierto(input.productoBaseId);
    return ok(propio ?? AVISO_ABIERTO_POR_CATEGORIA[input.categoria]);
  }
}
