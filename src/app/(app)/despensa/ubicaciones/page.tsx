import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { toUbicacionResponse } from "@/app/_lib/pantry/to-response";
import { pantryModule } from "@/domains/pantry/infrastructure/pantry-module";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { UbicacionesScreen } from "./_components/ubicaciones-screen";

export const metadata: Metadata = { title: "Ubicaciones · Migas" };

export default async function UbicacionesPage() {
  const contexto = await getAuthContext();
  if (!contexto.ok) {
    redirect(
      contexto.error.code === "SIN_HOGAR" ? "/bienvenida" : "/login?next=%2Fdespensa%2Fubicaciones",
    );
  }
  const despensa = await pantryModule(contexto.value).getPantry.execute();
  if (!despensa.ok) throw new Error(despensa.error.message);

  const productos = new Map<string, number>();
  for (const l of despensa.value.lineas) {
    productos.set(l.ubicacionId, (productos.get(l.ubicacionId) ?? 0) + 1);
  }
  return (
    <UbicacionesScreen
      ubicaciones={despensa.value.ubicaciones.map((u) => ({
        ...toUbicacionResponse(u),
        productos: productos.get(u.id) ?? 0,
      }))}
    />
  );
}
