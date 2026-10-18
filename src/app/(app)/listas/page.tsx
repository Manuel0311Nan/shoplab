import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { toShoppingListSummary } from "@/app/_lib/shopping/to-response";
import { estadoListasSchema } from "@/contracts/shopping";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { MisListasScreen } from "./_components/mis-listas-screen";

export const metadata: Metadata = { title: "Mis listas · Migas" };

type Props = { searchParams: Promise<{ estado?: string | string[] }> };

export default async function MisListasPage({ searchParams }: Props) {
  const contexto = await getAuthContext();
  if (!contexto.ok) {
    redirect(contexto.error.code === "SIN_HOGAR" ? "/bienvenida" : "/login?next=%2Flistas");
  }

  // Un ?estado desconocido no es un error: se muestran las activas.
  const parsed = estadoListasSchema.safeParse((await searchParams).estado);
  const estado = parsed.success ? parsed.data : "activas";

  const result = await shoppingModule(contexto.value).listLists.execute({ estado });
  if (!result.ok) throw new Error(result.error.message);

  return (
    <MisListasScreen
      key={estado}
      estado={estado}
      pagina={{
        items: result.value.items.map(toShoppingListSummary),
        nextCursor: result.value.nextCursor,
      }}
    />
  );
}
