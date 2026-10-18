import { ShoppingErrors } from "@/domains/shopping/domain/shopping-errors";
import { MAX_LISTAS_ACTIVAS, type ShoppingList } from "@/domains/shopping/domain/shopping-list";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { ShoppingListRepository } from "./ports/shopping-list-repository";

/**
 * Antes de que haya una lista activa más (crear o desarchivar): si ya hay 15, hace falta
 * que el usuario elija cuál archivar. Devuelve esa lista ya archivada (sin guardar,
 * para guardarla junto con la otra en una transacción) o null si había sitio.
 *
 * Carrera aceptada: dos altas simultáneas con 14 activas pueden dejar 16. No rompe
 * nada y la siguiente alta vuelve a pedir que se archive una.
 */
export async function hacerSitio(
  lists: ShoppingListRepository,
  archivarListaId: string | undefined,
  ahora: Date,
): Promise<Result<ShoppingList | null>> {
  const activas = await lists.listarActivas();
  if (activas.length < MAX_LISTAS_ACTIVAS) return ok(null);

  if (archivarListaId === undefined) {
    return err(
      ShoppingErrors.limiteDeListas(
        MAX_LISTAS_ACTIVAS,
        activas.map(({ id, nombre }) => ({ id, nombre })),
      ),
    );
  }

  const elegida = activas.some((l) => l.id === archivarListaId)
    ? await lists.findById(archivarListaId)
    : null;
  if (elegida === null || elegida.estaArchivada) {
    return err(ShoppingErrors.listaParaArchivarNoValida());
  }
  elegida.archivar(ahora);
  return ok(elegida);
}
