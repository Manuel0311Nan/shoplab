import { type GrupoParecido, gruposParecidos } from "@/domains/catalog/domain/parecidos";
import type { ProductoRecordado } from "@/domains/catalog/domain/producto-recordado";
import { ok, type Result } from "@/shared/kernel/result";
import { normalizarNombre } from "@/shared/kernel/texto";
import type { ProductoBaseRepository } from "../ports/producto-base-repository";
import type { ProductoRecordadoRepository } from "../ports/producto-recordado-repository";

/** Más que suficiente para un hogar; el autocompletado envía 300. */
export const MAX_MIS_PRODUCTOS = 1000;

export interface MisProductos {
  /** Lo que el hogar escribió a mano (no la lista base), por nombre. */
  readonly productos: ProductoRecordado[];
  /** Posibles duplicados para proponer «unir». */
  readonly parecidos: GrupoParecido[];
}

/**
 * «Mis productos»: la memoria de texto libre del hogar. Los recuerdos que solo guardan
 * la categoría preferida de un producto de la lista base no salen: ese producto se
 * edita en la lista base, no aquí.
 */
export class MisProductosQuery {
  constructor(
    private readonly base: ProductoBaseRepository,
    private readonly recordados: ProductoRecordadoRepository,
  ) {}

  async execute(): Promise<Result<MisProductos>> {
    const [base, recordados] = await Promise.all([
      this.base.listar(),
      this.recordados.listar(MAX_MIS_PRODUCTOS),
    ]);
    const nombresBase = new Set(base.map((b) => normalizarNombre(b.nombre)));
    const productos = recordados
      .filter((r) => !nombresBase.has(r.nombreNormalizado))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return ok({ productos, parecidos: gruposParecidos(productos, base) });
  }
}
