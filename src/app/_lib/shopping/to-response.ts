import type { ShoppingItemResponse, ShoppingListResponse } from "@/contracts/shopping";
import type { ShoppingListView } from "@/domains/shopping/application/queries/get-shopping-list.query";
import type { ShoppingItemSnapshot } from "@/domains/shopping/domain/shopping-item";

export function toShoppingItemResponse(item: ShoppingItemSnapshot): ShoppingItemResponse {
  return {
    id: item.id,
    nombre: item.nombre,
    cantidad: { valor: item.cantidad.valor, unidad: item.cantidad.unidad },
    nota: item.nota,
    ingredientId: item.ingredientId,
    compradoAt: item.compradoAt?.toISOString() ?? null,
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function toShoppingListResponse(view: ShoppingListView): ShoppingListResponse {
  return {
    id: view.id,
    nombre: view.nombre,
    archivada: view.archivadaAt !== null,
    updatedAt: view.updatedAt.toISOString(),
    items: view.items.map(toShoppingItemResponse),
  };
}
