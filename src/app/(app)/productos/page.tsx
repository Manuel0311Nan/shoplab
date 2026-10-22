import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { misProductos } from "@/app/_lib/catalog/mis-productos";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { MisProductosScreen } from "./_components/mis-productos-screen";

export const metadata: Metadata = { title: "Mis productos · Migas" };

/** Lo que el hogar ha escrito a mano: corregir nombres, unir duplicados, categoría y pack. */
export default async function MisProductosPage() {
  const contexto = await getAuthContext();
  if (!contexto.ok) {
    redirect(contexto.error.code === "SIN_HOGAR" ? "/bienvenida" : "/login?next=%2Fproductos");
  }
  const result = await misProductos(contexto.value);
  if (!result.ok) throw new Error(result.error.message);
  return <MisProductosScreen datos={result.value} />;
}
