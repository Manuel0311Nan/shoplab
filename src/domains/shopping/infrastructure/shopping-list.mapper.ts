import type { Prisma } from "@/generated/prisma/client";
import { ShoppingItem } from "@/domains/shopping/domain/shopping-item";
import { ShoppingList } from "@/domains/shopping/domain/shopping-list";
import { Cantidad } from "@/shared/kernel/cantidad";

export type ShoppingListRow = Prisma.ShoppingListGetPayload<{ include: { items: true } }>;

type ShoppingItemRow = ShoppingListRow["items"][number];
function cantidadDesdeBd(valor: Prisma.Decimal, unidad: string): Cantidad {
  const result = Cantidad.create(valor.toNumber(), unidad);
  if (!result.ok) {
    throw new Error(`Cantidad corrupta en base de datos: ${result.error.code}`);
  }
  return result.value;
}
function itemToDomain(row: ShoppingItemRow): ShoppingItem {
  return ShoppingItem.rehydrate({
    id: row.id,
    nombre: row.nombre,
    ingredientId: row.ingredientId,
    productoBaseId: row.productoBaseId,
    categoria: row.categoria,
    cantidad: cantidadDesdeBd(row.cantidadValor, row.cantidadUnidad),
    unidadesPorPack: row.unidadesPorPack,
    nota: row.nota,
    compradoAt: row.compradoAt,
    compradoPorId: row.compradoPorId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  });
}
export function shoppingListToDomain(row: ShoppingListRow): ShoppingList {
  return ShoppingList.rehydrate(
    {
      id: row.id,
      nombre: row.nombre,
      archivadaAt: row.archivadaAt,
      general: row.general,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    },
    row.items.map(itemToDomain),
  );
}
