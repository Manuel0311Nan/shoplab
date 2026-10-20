import "server-only";

import { cache } from "react";
import { z } from "zod";
import { verReceta } from "@/app/_lib/recipes/recetas-con-despensa";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { notFoundError } from "@/shared/kernel/errors";
import { err } from "@/shared/kernel/result";

const idSchema = z.uuid();

/** Compartido por la página y generateMetadata (cache: una sola consulta). */
export const loadReceta = cache(async (recetaId: string) => {
  if (!idSchema.safeParse(recetaId).success) {
    return err(notFoundError("RECETA_NO_ENCONTRADA", "Esa receta no existe"));
  }
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  return verReceta(auth.value, recetaId);
});
