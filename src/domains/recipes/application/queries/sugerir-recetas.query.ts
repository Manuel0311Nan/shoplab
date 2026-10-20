import {
  compararEvaluaciones,
  type Evaluacion,
  type Existencia,
  evaluarReceta,
  MAX_FALTAN_CASI,
} from "@/domains/recipes/domain/disponibilidad";
import { ok, type Result } from "@/shared/kernel/result";
import type { RecetaRepository } from "../ports/receta-repository";

export interface Sugerencias {
  /** Se pueden hacer con lo que hay, con las raciones ajustadas. */
  readonly puedes: Evaluacion[];
  /** Les faltan uno o dos ingredientes (o cantidad de alguno). */
  readonly casi: Evaluacion[];
  /** Cuántas necesitan más compra que eso: no se listan. */
  readonly masCompra: number;
}

/** Recetas de la biblioteca según la despensa del hogar, en el orden en que se enseñan. */
export class SugerirRecetasQuery {
  constructor(private readonly recetas: RecetaRepository) {}

  async execute(input: { existencias: readonly Existencia[] }): Promise<Result<Sugerencias>> {
    const evaluaciones = (await this.recetas.listar())
      .map((r) => evaluarReceta(r, input.existencias))
      .sort(compararEvaluaciones);

    const puedes = evaluaciones.filter((e) => e.sePuedeHacer);
    const casi = evaluaciones.filter((e) => !e.sePuedeHacer && e.faltan <= MAX_FALTAN_CASI);
    return ok({ puedes, casi, masCompra: evaluaciones.length - puedes.length - casi.length });
  }
}
