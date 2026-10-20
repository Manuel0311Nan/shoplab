import {
  type Evaluacion,
  type Existencia,
  evaluarReceta,
} from "@/domains/recipes/domain/disponibilidad";
import { notFoundError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { RecetaRepository } from "../ports/receta-repository";

export interface GetRecetaInput {
  readonly recetaId: string;
  readonly existencias: readonly Existencia[];
  /** Al editar: otras raciones. Sin ellas, las ajustadas a la despensa. */
  readonly raciones?: number;
}

/** Una receta cruzada con la despensa: qué hay, qué falta y para cuántas raciones. */
export class GetRecetaQuery {
  constructor(private readonly recetas: RecetaRepository) {}

  async execute(input: GetRecetaInput): Promise<Result<Evaluacion>> {
    const receta = await this.recetas.findById(input.recetaId);
    if (receta === null) {
      return err(notFoundError("RECETA_NO_ENCONTRADA", "Esa receta no existe"));
    }
    return ok(evaluarReceta(receta, input.existencias, input.raciones));
  }
}
