import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { emojisProductos, packsRecordados } from "@/app/_lib/memoria-hogar";
import { toShoppingListResponse } from "@/app/_lib/shopping/to-response";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { ShoppingListScreen } from "./_components/shopping-list-screen";
import { loadShoppingList } from "./_data";
type Props = { params: Promise<{ listId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { listId } = await params;
  const result = await loadShoppingList(listId);
  return { title: result.ok ? `${result.value.nombre} · Migas` : "Lista · Migas" };
}

export default async function ShoppingListPage({ params }: Props) {
  const { listId } = await params;
  const result = await loadShoppingList(listId);

  if (!result.ok) {
    // Fuera de try/catch: redirect() y notFound() funcionan lanzando una excepción.
    if (result.error.type === "unauthorized") {
      redirect(`/login?next=${encodeURIComponent(`/listas/${listId}`)}`);
    }
    if (result.error.code === "SIN_HOGAR") redirect("/bienvenida");
    if (result.error.type === "not_found") notFound();
    throw new Error(result.error.message);
  }
  // Con la lista ya cargada hay sesión: la memoria es una ayuda y nunca falla la página.
  const auth = await getAuthContext();
  const [packs, emojis] = auth.ok
    ? await Promise.all([packsRecordados(auth.value), emojisProductos(auth.value)])
    : [{}, {}];
  return (
    <ShoppingListScreen list={toShoppingListResponse(result.value)} packs={packs} emojis={emojis} />
  );
}
