"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actualizarProducto, anadirProducto } from "@/app/_lib/shopping/productos-con-catalogo";
import { toShoppingItemResponse } from "@/app/_lib/shopping/to-response";
import {
  type AddItemRequest,
  addItemRequestSchema,
  type CantidadDto,
  cantidadSchema,
  type ShoppingItemResponse,
} from "@/contracts/shopping";
import { type CategoriaDto, categoriaSchema } from "@/contracts/categoria";
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

  const result = await anadirProducto(auth.value, {
    listId: id.data,
    itemId: body.data.id,
    nombre: body.data.nombre,
    cantidad: body.data.cantidad,
    nota: body.data.nota ?? null,
    productoBaseId: body.data.productoBaseId ?? null,
    unidadesPorPack: body.data.unidadesPorPack ?? null,
    ...(body.data.categoria === undefined ? {} : { categoria: body.data.categoria }),
    ...(body.data.duplicado === undefined ? {} : { duplicado: body.data.duplicado }),
    ...(body.data.unidadFinal === undefined ? {} : { unidadFinal: body.data.unidadFinal }),
    ...(body.data.cantidadFinal === undefined ? {} : { cantidadFinal: body.data.cantidadFinal }),
  });

  if (!result.ok) return result;

  // Todas las listas: la general enseña los productos de cada una.
  revalidatePath("/listas/[listId]", "page");
  revalidatePath("/listas");
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

  // Todas las listas: la general enseña los productos de cada una.
  revalidatePath("/listas/[listId]", "page");
  revalidatePath("/listas");
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

  // Todas las listas: la general enseña los productos de cada una.
  revalidatePath("/listas/[listId]", "page");
  revalidatePath("/listas");
  return ok(toShoppingItemResponse(result.value));
}

export async function removeItemAction(listId: string, itemId: string): Promise<Result<void>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;

  const ids = itemIdsSchema.safeParse({ listId, itemId });
  if (!ids.success) return datosNoValidos();

  const result = await shoppingModule(auth.value).removeItem.execute(ids.data);
  if (!result.ok) return result;

  // Todas las listas: la general enseña los productos de cada una.
  revalidatePath("/listas/[listId]", "page");
  revalidatePath("/listas");
  return ok(undefined);
}

export async function updateItemCategoryAction(
  listId: string,
  itemId: string,
  categoria: CategoriaDto,
): Promise<Result<ShoppingItemResponse>> {
  const auth = await getAuthContext();
  if (!auth.ok) return auth;

  const ids = itemIdsSchema.safeParse({ listId, itemId });
  const body = categoriaSchema.safeParse(categoria);
  if (!ids.success || !body.success) return datosNoValidos();

  const result = await actualizarProducto(auth.value, {
    ...ids.data,
    categoria: body.data,
    usuarioId: auth.value.userId,
  });
  if (!result.ok) return result;

  // Todas las listas: la general enseña los productos de cada una.
  revalidatePath("/listas/[listId]", "page");
  return ok(toShoppingItemResponse(result.value));
}
