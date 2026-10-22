"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toShoppingListResponse, toShoppingListSummary } from "@/app/_lib/shopping/to-response";
import {
  type CreateListRequest,
  createListRequestSchema,
  type ModoTerminarCompraDto,
  modoTerminarCompraSchema,
  type ShoppingListPage,
  type ShoppingListResponse,
  type UpdateListRequest,
  updateListRequestSchema,
} from "@/contracts/shopping";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { validationError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";

const idSchema = z.uuid();

function datosNoValidos() {
  return err(validationError("PETICION_NO_VALIDA", "Los datos enviados no son válidos"));
}

/**
 * Crea una lista. No redirige: con 15 activas devuelve LIMITE_DE_LISTAS y el cliente
 * pregunta cuál archivar antes de reintentar; si va bien, navega él a la lista (D3).
 */
export async function crearListaAction(input: CreateListRequest): Promise<Result<{ id: string }>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;

  const body = createListRequestSchema.safeParse(input);
  if (!body.success) return datosNoValidos();

  const result = await shoppingModule(auth.value).createList.execute({
    nombre: body.data.nombre,
    ...(body.data.id === undefined ? {} : { listId: body.data.id }),
    ...(body.data.archivarListaId === undefined
      ? {}
      : { archivarListaId: body.data.archivarListaId }),
  });
  if (!result.ok) return result;

  revalidatePath("/listas");
  return ok({ id: result.value.id });
}

/** Renombrar, archivar o desarchivar (con 15 activas, `archivarListaId` hace el intercambio). */
export async function actualizarListaAction(
  listId: string,
  input: UpdateListRequest,
): Promise<Result<{ id: string }>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(listId);
  const body = updateListRequestSchema.safeParse(input);
  if (!id.success || !body.success) return datosNoValidos();

  const result = await shoppingModule(auth.value).updateList.execute({
    listId: id.data,
    ...(body.data.nombre === undefined ? {} : { nombre: body.data.nombre }),
    ...(body.data.archivada === undefined ? {} : { archivada: body.data.archivada }),
    ...(body.data.archivarListaId === undefined
      ? {}
      : { archivarListaId: body.data.archivarListaId }),
  });
  if (!result.ok) return result;

  revalidatePath("/listas");
  // Todas las listas: la general enseña los productos de cada una.
  revalidatePath("/listas/[listId]", "page");
  return ok({ id: id.data });
}

export async function eliminarListaAction(listId: string): Promise<Result<void>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(listId);
  if (!id.success) return datosNoValidos();

  const result = await shoppingModule(auth.value).deleteList.execute({ listId: id.data });
  if (!result.ok) return result;

  revalidatePath("/listas");
  return ok(undefined);
}

/** "Cargar más" en Archivadas. */
export async function cargarArchivadasAction(cursor: string): Promise<Result<ShoppingListPage>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;
  if (typeof cursor !== "string" || cursor.length > 200) return datosNoValidos();

  const result = await shoppingModule(auth.value).listLists.execute({
    estado: "archivadas",
    cursor,
  });
  if (!result.ok) return result;

  return ok({
    items: result.value.items.map(toShoppingListSummary),
    nextCursor: result.value.nextCursor,
  });
}

export async function finishShoppingAction(
  listId: string,
  modo: ModoTerminarCompraDto,
): Promise<Result<ShoppingListResponse>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;

  const id = z.uuid().safeParse(listId);
  const modoValido = modoTerminarCompraSchema.safeParse(modo);
  if (!id.success || !modoValido.success) {
    return err(validationError("PETICION_NO_VALIDA", "Los datos enviados no son válidos"));
  }

  const result = await shoppingModule(auth.value).finishShopping.execute({
    listId: id.data,
    modo: modoValido.data,
  });
  if (!result.ok) return result;

  // Todas las listas: la general enseña los productos de cada una.
  revalidatePath("/listas/[listId]", "page");
  revalidatePath("/listas");
  return ok(toShoppingListResponse(result.value));
}
