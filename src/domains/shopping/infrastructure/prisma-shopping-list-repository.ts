import "server-only";
import type { ShoppingListRepository } from "@/domains/shopping/application/ports/shopping-list-repository";
import type { ShoppingList, ShoppingListSnapshot } from "@/domains/shopping/domain/shopping-list";
import { TenantRepository } from "@/shared/kernel/tenant-repository";
import { shoppingListToDomain } from "./shopping-list.mapper";
export class PrismaShoppingListRepository
  extends TenantRepository
  implements ShoppingListRepository
{
  async findById(id: string): Promise<ShoppingList | null> {
    const row = await this.db.shoppingList.findFirst({
      where: { id, deletedAt: null },
      include: { items: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } } },
    });
    return row === null ? null : shoppingListToDomain(row);
  }
  async listarActivas(limite: number): Promise<ShoppingListSnapshot[]> {
    return this.db.shoppingList.findMany({
      where: { deletedAt: null, archivadaAt: null },
      orderBy: { createdAt: "asc" },
      take: limite,
      select: { id: true, nombre: true, archivadaAt: true, createdAt: true, updatedAt: true },
    });
  }

  async save(list: ShoppingList): Promise<void> {
    const lista = list.toSnapshot();
    await this.db.$transaction([
      // upsert: la misma llamada guarda una lista nueva (CreateShoppingList) o una existente.
      this.db.shoppingList.upsert({
        where: { id: lista.id },
        create: { ...lista, hogarId: this.hogarId },
        update: {
          nombre: lista.nombre,
          archivadaAt: lista.archivadaAt,
          updatedAt: lista.updatedAt,
        },
      }),
      ...list.itemsModificados().map((item) => {
        const datos = {
          nombre: item.nombre,
          ingredientId: item.ingredientId,
          cantidadValor: item.cantidad.valor,
          cantidadUnidad: item.cantidad.unidad,
          nota: item.nota,
          compradoAt: item.compradoAt,
          compradoPorId: item.compradoPorId,
          updatedAt: item.updatedAt,
          deletedAt: item.deletedAt,
        };
        return this.db.shoppingItem.upsert({
          where: { id: item.id },
          create: {
            ...datos,
            id: item.id,
            hogarId: this.hogarId,
            listaId: lista.id,
            createdAt: item.createdAt,
          },
          update: datos,
        });
      }),
    ]);
  }
}
