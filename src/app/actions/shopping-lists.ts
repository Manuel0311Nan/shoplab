"use server";

import { redirect } from "next/navigation";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { getAuthContext } from "@/shared/kernel/auth-context";

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
