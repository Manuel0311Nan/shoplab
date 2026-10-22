import type {
  ResumenLista,
  ShoppingListRepository,
} from "@/domains/shopping/application/ports/shopping-list-repository";
import { ShoppingItem, type ShoppingItemSnapshot } from "@/domains/shopping/domain/shopping-item";
import {
  limiteDeCaducidad,
  ShoppingList,
  type ShoppingListSnapshot,
} from "@/domains/shopping/domain/shopping-list";
import type { Clock } from "@/shared/kernel/clock";
import type { Cursor } from "@/shared/kernel/cursor";
import { AHORA } from "./builders";

interface ListaGuardada {
  lista: ShoppingListSnapshot;
  readonly items: Map<string, ShoppingItemSnapshot>;
}

const porFechaDesc =
  (fecha: (l: ShoppingListSnapshot) => Date) => (a: ResumenLista, b: ResumenLista) =>
    fecha(b).getTime() - fecha(a).getTime() || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);

/**
 * Fake del repositorio que imita a Prisma: guarda snapshots (no instancias), así que
 * los cambios sin `save` no se ven, y cada `findById` devuelve una lista nueva.
 * Cumple la misma suite de contrato que `PrismaShoppingListRepository`.
 */
export class InMemoryShoppingListRepository implements ShoppingListRepository {
  private readonly store = new Map<string, ListaGuardada>();
  saveCount = 0;

  constructor(
    lists: readonly ShoppingList[] = [],
    private readonly clock: Clock = { now: () => AHORA },
  ) {
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
    if (guardada === undefined || !this.vigente(guardada.lista)) return null;

    const items = [...guardada.items.values()]
      .filter((item) => item.deletedAt === null)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((item) => ShoppingItem.rehydrate(item));

    return ShoppingList.rehydrate(guardada.lista, items);
  }

  async listarActivas(): Promise<ResumenLista[]> {
    return this.resumenes()
      .filter((l) => l.archivadaAt === null)
      .sort(
        (a, b) => Number(b.general) - Number(a.general) || porFechaDesc((l) => l.updatedAt)(a, b),
      );
  }

  async listarActivasConItems(): Promise<ShoppingList[]> {
    const listas = await Promise.all(
      (await this.listarActivas()).map((resumen) => this.findById(resumen.id)),
    );
    return listas.filter((l): l is ShoppingList => l !== null);
  }

  async listarArchivadas(opciones: {
    despuesDe?: Cursor;
    limite: number;
  }): Promise<ResumenLista[]> {
    const c = opciones.despuesDe;
    return this.resumenes()
      .filter((l): l is ResumenLista & { archivadaAt: Date } => l.archivadaAt !== null)
      .filter(
        (l) =>
          c === undefined ||
          l.archivadaAt.getTime() < c.fecha.getTime() ||
          (l.archivadaAt.getTime() === c.fecha.getTime() && l.id < c.id),
      )
      .sort(porFechaDesc((l) => l.archivadaAt ?? l.updatedAt))
      .slice(0, opciones.limite);
  }

  async contarActivas(): Promise<number> {
    return (await this.listarActivas()).filter((l) => !l.general).length;
  }

  async save(list: ShoppingList): Promise<void> {
    await this.guardarVarias([list]);
  }

  /** Como el repositorio de Prisma: actualiza la lista y hace upsert de los ítems modificados. */
  async guardarVarias(lists: readonly ShoppingList[]): Promise<void> {
    for (const list of lists) {
      const guardada = this.store.get(list.id) ?? { lista: list.toSnapshot(), items: new Map() };
      guardada.lista = list.toSnapshot();
      for (const item of list.itemsModificados()) guardada.items.set(item.id, item);
      this.store.set(list.id, guardada);
    }
    this.saveCount += 1;
  }

  private vigente(lista: ShoppingListSnapshot): boolean {
    if (lista.deletedAt !== null) return false;
    return lista.archivadaAt === null || lista.archivadaAt > limiteDeCaducidad(this.clock.now());
  }

  private resumenes(): ResumenLista[] {
    return [...this.store.values()]
      .filter((g) => this.vigente(g.lista))
      .map((g) => {
        const items = [...g.items.values()].filter((i) => i.deletedAt === null);
        return {
          ...g.lista,
          total: items.length,
          pendientes: items.filter((i) => i.compradoAt === null).length,
        };
      });
  }
}
