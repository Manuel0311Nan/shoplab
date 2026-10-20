import "server-only";
import { GetRecetaQuery } from "@/domains/recipes/application/queries/get-receta.query";
import { SugerirRecetasQuery } from "@/domains/recipes/application/queries/sugerir-recetas.query";
import { PrismaRecetaRepository } from "./prisma-receta-repository";

/**
 * Biblioteca global: no depende del hogar. Lo del hogar (su despensa) lo pone el
 * orquestador `app/_lib/recipes/recetas-con-despensa.ts`.
 */
export function recipesModule() {
  const recetas = new PrismaRecetaRepository();
  return {
    sugerirRecetas: new SugerirRecetasQuery(recetas),
    getReceta: new GetRecetaQuery(recetas),
  };
}

export type RecipesModule = ReturnType<typeof recipesModule>;
