import type { ProductoRecordado } from "@/domains/catalog/domain/producto-recordado";
import { ok, type Result } from "@/shared/kernel/result";
import type { ProductoRecordadoRepository } from "../ports/producto-recordado-repository";

/** Cuántos recuerdos se envían al autocompletado: de sobra para un hogar. */
export const MAX_RECORDADOS = 300;

/** Lo que el hogar ya escribió, para sugerirlo al autocompletar. */
export class ListHouseholdProductsQuery {
  constructor(private readonly recordados: ProductoRecordadoRepository) {}

  async execute(): Promise<Result<ProductoRecordado[]>> {
    return ok(await this.recordados.listar(MAX_RECORDADOS));
  }
}
