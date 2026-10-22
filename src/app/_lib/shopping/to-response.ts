import type {
  ShoppingItemResponse,
  ShoppingListResponse,
  ShoppingListSummary,
} from "@/contracts/shopping";
import type {
  ItemDeLista,
  ShoppingListView,
} from "@/domains/shopping/application/queries/get-shopping-list.query";
import type { TarjetaLista } from "@/domains/shopping/application/queries/list-shopping-lists.query";
import type { ShoppingItemSnapshot } from "@/domains/shopping/domain/shopping-item";
import { DIAS_EN_ARCHIVADAS } from "@/domains/shopping/domain/shopping-list";

const caducaEl = (archivadaAt: Date | null) =>
  archivadaAt === null ? null : new Date(archivadaAt.getTime() + DIAS_EN_ARCHIVADAS * 86_400_000);

export function toShoppingItemResponse(
  item: ShoppingItemSnapshot | ItemDeLista,
): ShoppingItemResponse {
  return {
    id: item.id,
    nombre: item.nombre,
    cantidad: { valor: item.cantidad.valor, unidad: item.cantidad.unidad },
    unidadesPorPack: item.unidadesPorPack,
    nota: item.nota,
    ingredientId: item.ingredientId,
    productoBaseId: item.productoBaseId,
    categoria: item.categoria,
    compradoAt: item.compradoAt?.toISOString() ?? null,
    updatedAt: item.updatedAt.toISOString(),
    ...("listaId" in item ? { listaId: item.listaId, listaNombre: item.listaNombre } : {}),
  };
}

export function toShoppingListResponse(view: ShoppingListView): ShoppingListResponse {
  return {
    id: view.id,
    nombre: view.nombre,
    archivada: view.archivadaAt !== null,
    general: view.general,
    caducaEl: caducaEl(view.archivadaAt)?.toISOString() ?? null,
    updatedAt: view.updatedAt.toISOString(),
    items: view.items.map(toShoppingItemResponse),
  };
}

export function toShoppingListSummary(lista: TarjetaLista): ShoppingListSummary {
  return {
    id: lista.id,
    nombre: lista.nombre,
    archivada: lista.archivadaAt !== null,
    archivadaAt: lista.archivadaAt?.toISOString() ?? null,
    caducaEl: lista.caducaEl?.toISOString() ?? null,
    general: lista.general,
    pendientes: lista.pendientes,
    total: lista.total,
    updatedAt: lista.updatedAt.toISOString(),
  };
}
