"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { anadirFaltantes } from "@/app/_lib/recipes/recetas-con-despensa";
import {
  type FaltantesALaListaResponse,
  faltantesALaListaRequestSchema,
} from "@/contracts/recipes";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { validationError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";

const inputSchema = faltantesALaListaRequestSchema.extend({ recetaId: z.uuid() });

/** «Añadir lo que falta»: lo calcula el servidor con la despensa de ese momento. */
export async function anadirFaltantesAction(
  input: z.input<typeof inputSchema>,
): Promise<Result<FaltantesALaListaResponse>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  const datos = inputSchema.safeParse(input);
  if (!datos.success) {
    return err(validationError("PETICION_NO_VALIDA", "Los datos enviados no son válidos"));
  }

  const result = await anadirFaltantes(auth.value, {
    recetaId: datos.data.recetaId,
    raciones: datos.data.raciones,
    ...(datos.data.listaId === undefined ? {} : { listaId: datos.data.listaId }),
  });
  if (!result.ok) return result;

  revalidatePath(`/listas/${result.value.listaId}`);
  revalidatePath("/listas");
  return ok(result.value);
}
