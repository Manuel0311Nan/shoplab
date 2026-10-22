import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { emojisProductos, packsRecordados, ubicacionesRecordadas } from "@/app/_lib/memoria-hogar";
import { toPantryResponse } from "@/app/_lib/pantry/to-response";
import { pantryModule } from "@/domains/pantry/infrastructure/pantry-module";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { DespensaScreen } from "./_components/despensa-screen";

export const metadata: Metadata = { title: "Despensa · Migas" };

export default async function DespensaPage() {
  const contexto = await getAuthContext();
  if (!contexto.ok) {
    redirect(contexto.error.code === "SIN_HOGAR" ? "/bienvenida" : "/login?next=%2Fdespensa");
  }

  const [despensa, listas, packs, recordadas, emojis] = await Promise.all([
    pantryModule(contexto.value).getPantry.execute(),
    shoppingModule(contexto.value).listLists.execute({ estado: "activas" }),
    packsRecordados(contexto.value),
    ubicacionesRecordadas(contexto.value),
    emojisProductos(contexto.value),
  ]);
  if (!despensa.ok) throw new Error(despensa.error.message);

  return (
    // useSearchParams en la pantalla: Next pide un Suspense alrededor.
    <Suspense>
      <DespensaScreen
        despensa={toPantryResponse(despensa.value)}
        listas={listas.ok ? listas.value.items.map(({ id, nombre }) => ({ id, nombre })) : []}
        packs={packs}
        recordadas={recordadas}
        emojis={emojis}
      />
    </Suspense>
  );
}
