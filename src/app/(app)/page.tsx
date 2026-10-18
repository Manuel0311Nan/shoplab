import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { crearPrimeraListaAction } from "@/app/actions/shopping-lists";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { Button } from "@/shared/ui/button";

export const metadata: Metadata = { title: "ShopList" };

/**
 * Portada: decide a dónde ir según la sesión. Hasta la vista 2 ("Mis listas")
 * abre directamente la primera lista del hogar.
 */
export default async function Home() {
  const contexto = await getAuthContext();
  if (!contexto.ok) {
    redirect(contexto.error.code === "SIN_HOGAR" ? "/bienvenida" : "/login");
  }

  const listas = await shoppingModule(contexto.value).listLists.execute();
  const primera = listas.ok ? listas.value.at(0) : undefined;
  if (primera !== undefined) redirect(`/listas/${primera.id}`);

  // Solo si la primera lista no llegó a crearse con el hogar.
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-4 px-5 pt-4">
      <h1 className="text-[28px] leading-9 font-bold">Aún no tienes listas</h1>
      <p className="text-muted-foreground">Crea tu primera lista de la compra para empezar.</p>
      <form action={crearPrimeraListaAction}>
        <Button type="submit" className="h-11 px-5 text-base font-semibold">
          Crear mi lista
        </Button>
      </form>
    </section>
  );
}
