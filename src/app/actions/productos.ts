"use server";

import { revalidatePath } from "next/cache";
import { estandarizarProducto, olvidarProducto } from "@/app/_lib/catalog/mis-productos";
import {
  type EstandarizarProductoRequest,
  type EstandarizarProductoResponse,
  estandarizarProductoRequestSchema,
  olvidarProductoRequestSchema,
} from "@/contracts/catalog";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { validationError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";

function datosNoValidos() {
  return err(validationError("PETICION_NO_VALIDA", "Los datos enviados no son válidos"));
}

/** Lo que cambia al estandarizar: listas, despensa y la propia pantalla. */
function revalidar() {
  revalidatePath("/listas/[listId]", "page");
  revalidatePath("/listas");
  revalidatePath("/despensa");
  revalidatePath("/productos");
}

/** Renombrar o unir un producto del hogar en todas partes (Mis productos, lista, despensa). */
export async function estandarizarProductoAction(
  input: EstandarizarProductoRequest,
): Promise<Result<EstandarizarProductoResponse>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  const body = estandarizarProductoRequestSchema.safeParse(input);
  if (!body.success) return datosNoValidos();

  const result = await estandarizarProducto(auth.value, {
    desde: body.data.desde,
    nombre: body.data.nombre,
    ...(body.data.productoBaseId == null ? {} : { productoBaseId: body.data.productoBaseId }),
    ...(body.data.categoria === undefined ? {} : { categoria: body.data.categoria }),
    ...(body.data.unidad === undefined ? {} : { unidad: body.data.unidad }),
    ...(body.data.unidadesPorPack === undefined
      ? {}
      : { unidadesPorPack: body.data.unidadesPorPack }),
  });
  if (!result.ok) return result;
  revalidar();
  return ok(result.value);
}

/** Deja de sugerirse en el autocompletado. */
export async function olvidarProductoAction(nombreNormalizado: string): Promise<Result<void>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  const body = olvidarProductoRequestSchema.safeParse({ nombreNormalizado });
  if (!body.success) return datosNoValidos();

  const result = await olvidarProducto(auth.value, body.data.nombreNormalizado);
  if (!result.ok) return result;
  revalidatePath("/productos");
  return ok(undefined);
}
