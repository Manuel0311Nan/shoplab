import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext, getIdentity } from "@/shared/kernel/auth-context";
import { newId } from "@/shared/kernel/ids";
import { BienvenidaForm } from "../_components/bienvenida-form";

export const metadata: Metadata = { title: "Bienvenida · ShopList" };

export default async function BienvenidaPage() {
  const identity = await getIdentity();
  if (!identity.ok) redirect("/login");
  // Ya tiene hogar (p. ej. vuelve atrás tras crearlo): nada que hacer aquí.
  if ((await getAuthContext()).ok) redirect("/");

  const nombre = identity.value.nombre.split(" ").at(0) ?? identity.value.nombre;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-balance">Hola, {nombre}</h1>
        <p className="text-muted-foreground">
          Ponle nombre a tu hogar para empezar tu primera lista.
        </p>
      </div>
      <BienvenidaForm hogarId={newId()} nombreSugerido={`Casa de ${nombre}`} />
    </div>
  );
}
