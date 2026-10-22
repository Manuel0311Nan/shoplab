import "server-only";
import type { EmojisProductos, PacksRecordados, UbicacionesRecordadas } from "@/contracts/memoria";
import { catalogHogarModule } from "@/domains/catalog/infrastructure/catalog-module";
import { pantryModule } from "@/domains/pantry/infrastructure/pantry-module";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import type { AuthContext } from "@/shared/kernel/auth-context";

/**
 * La memoria del hogar es una ayuda: si no se puede leer, los formularios proponen lo
 * de siempre (1 ud., la ubicación por categoría). Se registra el error y se sigue.
 */
export async function packsRecordados(auth: AuthContext): Promise<PacksRecordados> {
  try {
    const r = await shoppingModule(auth).packsRecordados.execute();
    if (!r.ok) return {};
    return Object.fromEntries(
      r.value.map((p) => [
        p.nombreNormalizado,
        { unidadesPorPack: p.unidadesPorPack, enPack: p.enPack },
      ]),
    );
  } catch (error) {
    console.error("[memoria] no se pudieron leer los packs", error);
    return {};
  }
}

export async function emojisProductos(
  auth: Pick<AuthContext, "hogarId">,
): Promise<EmojisProductos> {
  try {
    const r = await catalogHogarModule(auth).emojis.execute();
    return r.ok ? Object.fromEntries(r.value) : {};
  } catch (error) {
    console.error("[memoria] no se pudieron leer los emojis", error);
    return {};
  }
}

export async function ubicacionesRecordadas(
  auth: Pick<AuthContext, "hogarId">,
): Promise<UbicacionesRecordadas> {
  try {
    const r = await pantryModule(auth).ubicacionesRecordadas.execute();
    if (!r.ok) return {};
    return Object.fromEntries(r.value.map((u) => [u.nombreNormalizado, u.ubicacionId]));
  } catch (error) {
    console.error("[memoria] no se pudieron leer las ubicaciones", error);
    return {};
  }
}
