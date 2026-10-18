import type { ShoppingListRepository } from "@/domains/shopping/application/ports/shopping-list-repository";
import { ShoppingItem, type ShoppingItemSnapshot } from "@/domains/shopping/domain/shopping-item";
import { ShoppingList, type ShoppingListSnapshot } from "@/domains/shopping/domain/shopping-list";

interface ListaGuardada {
  lista: ShoppingListSnapshot;
  readonly items: Map<string, ShoppingItemSnapshot>;
}

/**
 * Fake del repositorio que imita a Prisma: guarda snapshots (no instancias), así que
 * los cambios sin `save` no se ven, y cada `findById` devuelve una lista nueva.
 * Cumple la misma suite de contrato que `PrismaShoppingListRepository`.
 */
export class InMemoryShoppingListRepository implements ShoppingListRepository {
  private readonly store = new Map<string, ListaGuardada>();
  saveCount = 0;

  constructor(lists: readonly ShoppingList[] = []) {
    for (const list of lists) {
      this.store.set(list.id, {
        lista: list.toSnapshot(),
        items: new Map(list.itemsActivos().map((item) => [item.id, item.toSnapshot()])),
      });
    }
  }

  /** Como el repositorio de Prisma: sin ítems borrados y ordenados por `createdAt`. */
  async findById(id: string): Promise<ShoppingList | null> {
    const guardada = this.store.get(id);
    if (guardada === undefined) return null;

    const items = [...guardada.items.values()]
      .filter((item) => item.deletedAt === null)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((item) => ShoppingItem.rehydrate(item));

    return ShoppingList.rehydrate(guardada.lista, items);
  }

  /** Como el repositorio de Prisma: sin archivadas, de la más antigua a la más reciente. */
  async listarActivas(limite: number): Promise<ShoppingListSnapshot[]> {
    return [...this.store.values()]
      .map((guardada) => guardada.lista)
      .filter((lista) => lista.archivadaAt === null)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, limite);
  }

  /** Como el repositorio de Prisma: actualiza la lista y hace upsert de los ítems modificados. */
  async save(list: ShoppingList): Promise<void> {
    const guardada = this.store.get(list.id) ?? { lista: list.toSnapshot(), items: new Map() };

    guardada.lista = list.toSnapshot();
    for (const item of list.itemsModificados()) guardada.items.set(item.id, item);

    this.store.set(list.id, guardada);
    this.saveCount += 1;
  }
}
