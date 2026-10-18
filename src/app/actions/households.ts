"use server";

import { redirect } from "next/navigation";
import { darDeAltaHogar } from "@/app/_lib/households/alta-hogar";
import { createHouseholdRequestSchema } from "@/contracts/households";
import { getIdentity } from "@/shared/kernel/auth-context";

export interface AltaHogarState {
  readonly error: string | null;
  /** Se devuelve para que el formulario conserve lo escrito si algo falla. */
  readonly nombre: string;
}

const texto = (valor: FormDataEntryValue | null): string | undefined =>
  typeof valor === "string" && valor !== "" ? valor : undefined;

/** Formulario de /bienvenida (`<form action>` + `useActionState`). */
export async function altaHogarAction(
  _anterior: AltaHogarState,
  formData: FormData,
): Promise<AltaHogarState> {
  const identity = await getIdentity();
  if (!identity.ok) redirect("/login");

  const nombre = texto(formData.get("nombre")) ?? "";
  const parsed = createHouseholdRequestSchema.safeParse({ id: texto(formData.get("id")), nombre });
  if (!parsed.success) {
    return { error: parsed.error.issues.at(0)?.message ?? "Revisa el nombre", nombre };
  }

  const result = await darDeAltaHogar(identity.value, parsed.data);
  // YA_TIENE_HOGAR = doble envío o pestaña antigua: el hogar ya existe, se sigue adelante.
  if (!result.ok && result.error.code !== "YA_TIENE_HOGAR") {
    return { error: result.error.message, nombre };
  }

  // Fuera de cualquier try: redirect() funciona lanzando una excepción.
  redirect("/");
}
