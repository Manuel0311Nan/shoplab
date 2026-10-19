import { CATEGORIA_POR_DEFECTO, type Categoria } from "@/shared/kernel/categoria";
import { ok, type Result } from "@/shared/kernel/result";
import { normalizarNombre } from "@/shared/kernel/texto";
import type { Unidad } from "@/shared/kernel/unidad";
import type { ProductoBaseRepository } from "../ports/producto-base-repository";
import type { ProductoRecordadoRepository } from "../ports/producto-recordado-repository";

export interface ResolverProductoInput {
  readonly nombre: string;
  /** El elegido en el autocompletado, si lo hubo. */
  readonly productoBaseId?: string | null;
}

export interface ProductoResuelto {
  /** Vínculo con la lista base, comprobado: null si no existe. */
  readonly productoBaseId: string | null;
  readonly categoria: Categoria;
  /** La unidad habitual, para proponerla. */
  readonly unidad: Unidad | null;
}

/**
 * Texto libre conectado al catálogo (D1, vista 3). Vincula sin preguntar: el elegido
 * en el autocompletado o, si no, el producto de la lista base con ese nombre o
 * sinónimo. La categoría y la unidad salen de la memoria del hogar si la hay (manda
 * sobre la lista base) y, si no, de la lista base; sin nada, "otros".
 */
export class ResolverProductoQuery {
  constructor(
    private readonly base: ProductoBaseRepository,
    private readonly recordados: ProductoRecordadoRepository,
  ) {}

  async execute(input: ResolverProductoInput): Promise<Result<ProductoResuelto>> {
    const nombreNormalizado = normalizarNombre(input.nombre);
    const elegido = input.productoBaseId ? await this.base.findById(input.productoBaseId) : null;
    const [producto, recordado] = await Promise.all([
      elegido ?? this.base.buscarPorNombre(nombreNormalizado),
      this.recordados.buscar(nombreNormalizado),
    ]);

    return ok({
      productoBaseId: producto?.id ?? null,
      categoria: recordado?.categoria ?? producto?.categoria ?? CATEGORIA_POR_DEFECTO,
      unidad: recordado?.unidad ?? producto?.unidadPorDefecto ?? null,
    });
  }
}
