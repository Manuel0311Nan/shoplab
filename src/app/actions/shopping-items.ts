"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toShoppingItemResponse } from "@/app/_lib/shopping/to-response";
import {
  type AddItemRequest,
  addItemRequestSchema,
  type CantidadDto,
  cantidadSchema,
  type ShoppingItemResponse,
} from "@/contracts/shopping";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { validationError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";

const idSchema = z.uuid();
const itemIdsSchema = z.object({ listId: idSchema, itemId: idSchema });

function datosNoValidos() {
  return err(validationError("PETICION_NO_VALIDA", "Los datos enviados no son válidos"));
}

export async function addItemAction(
  listId: string,
  input: AddItemRequest,
): Promise<Result<ShoppingItemResponse>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(listId);
  const body = addItemRequestSchema.safeParse(input);
  if (!id.success || !body.success) return datosNoValidos();

  const result = await shoppingModule(auth.value).addItem.execute({
    listId: id.data,
    itemId: body.data.id,
    nombre: body.data.nombre,
    cantidad: body.data.cantidad,
    nota: body.data.nota ?? null,
  });

  if (!result.ok) return result;

  revalidatePath(`/listas/${id.data}`);
  return ok(toShoppingItemResponse(result.value));
}

export async function setItemPurchasedAction(
  listId: string,
  itemId: string,
  comprado: boolean,
): Promise<Result<ShoppingItemResponse>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;

  const ids = itemIdsSchema.safeParse({ listId, itemId });
  if (!ids.success || typeof comprado !== "boolean") return datosNoValidos();

  const result = await shoppingModule(auth.value).updateItem.execute({
    ...ids.data,
    comprado,
    usuarioId: auth.value.userId,
  });
  if (!result.ok) return result;

  revalidatePath(`/listas/${ids.data.listId}`);
  return ok(toShoppingItemResponse(result.value));
}

export async function updateItemQuantityAction(
  listId: string,
  itemId: string,
  cantidad: CantidadDto,
): Promise<Result<ShoppingItemResponse>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;

  const ids = itemIdsSchema.safeParse({ listId, itemId });
  const body = cantidadSchema.safeParse(cantidad);
  if (!ids.success || !body.success) return datosNoValidos();

  const result = await shoppingModule(auth.value).updateItem.execute({
    ...ids.data,
    cantidad: body.data,
    usuarioId: auth.value.userId,
  });
  if (!result.ok) return result;

  revalidatePath(`/listas/${ids.data.listId}`);
  return ok(toShoppingItemResponse(result.value));
}

export async function removeItemAction(listId: string, itemId: string): Promise<Result<void>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;

  const ids = itemIdsSchema.safeParse({ listId, itemId });
  if (!ids.success) return datosNoValidos();

  const result = await shoppingModule(auth.value).removeItem.execute(ids.data);
  if (!result.ok) return result;

  revalidatePath(`/listas/${ids.data.listId}`);
  return ok(undefined);
}
