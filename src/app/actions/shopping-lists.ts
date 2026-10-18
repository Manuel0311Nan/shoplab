"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { toShoppingListResponse } from "@/app/_lib/shopping/to-response";
import {
  type ModoTerminarCompraDto,
  modoTerminarCompraSchema,
  type ShoppingListResponse,
} from "@/contracts/shopping";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { validationError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";

/** Portada sin listas: crea "Lista de la compra" y la abre. La vista 2 traerá el formulario completo. */
export async function crearPrimeraListaAction(): Promise<void> {
  const contexto = await getAuthContext();
  if (!contexto.ok) redirect("/login");

  const lista = await shoppingModule(contexto.value).createList.execute({
    nombre: "Lista de la compra",
  });
  if (!lista.ok) throw new Error(lista.error.message);

  redirect(`/listas/${lista.value.id}`);
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

  revalidatePath(`/listas/${id.data}`);
  return ok(toShoppingListResponse(result.value));
}
