import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { toRecetaDetalle } from "@/app/_lib/recipes/to-response";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { RecetaScreen } from "./_components/receta-screen";
import { loadReceta } from "./_data";

type Props = { params: Promise<{ recetaId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { recetaId } = await params;
  const result = await loadReceta(recetaId);
  return { title: result.ok ? `${result.value.receta.nombre} · Migas` : "Receta · Migas" };
}

export default async function RecetaPage({ params }: Props) {
  const { recetaId } = await params;
  const result = await loadReceta(recetaId);

  if (!result.ok) {
    // Fuera de try/catch: redirect() y notFound() funcionan lanzando una excepción.
    if (result.error.type === "unauthorized") {
      redirect(`/login?next=${encodeURIComponent(`/recetas/${recetaId}`)}`);
    }
    if (result.error.code === "SIN_HOGAR") redirect("/bienvenida");
    if (result.error.type === "not_found") notFound();
    throw new Error(result.error.message);
  }

  const auth = await getAuthContext();
  const listas = auth.ok
    ? await shoppingModule(auth.value).listLists.execute({ estado: "activas" })
    : null;

  return (
    <RecetaScreen
      receta={toRecetaDetalle(result.value)}
      listas={listas?.ok ? listas.value.items.map(({ id, nombre }) => ({ id, nombre })) : []}
    />
  );
}
