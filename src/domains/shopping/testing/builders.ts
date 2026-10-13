import { Cantidad } from "@/shared/kernel/cantidad";
import { ShoppingItem, type ShoppingItemSnapshot } from "@/domains/shopping/domain/shopping-item";
import { ShoppingList } from "@/domains/shopping/domain/shopping-list";

export const AHORA = new Date("2026-10-10T10:00:00.000Z");
export const DESPUES = new Date("2026-10-10T10:05:00.000Z");
export const LISTA_ID = "0199c000-0000-7000-8000-000000000001";
export const ITEM_ID = "0199c000-0000-7000-8000-000000000002";
export const USUARIO_ID = "0199c000-0000-7000-8000-000000000003";
export const OTRO_ID = "0199c000-0000-7000-8000-000000000004";

export function cantidad(valor: number, unidad: string): Cantidad {
  const result = Cantidad.create(valor, unidad);
  if (!result.ok) throw new Error(`Cantidad de prueba no válida: ${result.error.code}`);
  return result.value;
}

/** Un ítem ya existente (como si viniera de la BD). Sobrescribe solo lo que el test necesite. */
export function item(cambios: Partial<ShoppingItemSnapshot> = {}): ShoppingItem {
  return ShoppingItem.rehydrate({
    id: ITEM_ID,
    nombre: "Pan",
    ingredientId: null,
    cantidad: cantidad(1, "unidad"),
    nota: null,
    compradoAt: null,
    compradoPorId: null,
    createdAt: AHORA,
    updatedAt: AHORA,
    deletedAt: null,
    ...cambios,
  });
}

export function lista(
  items: readonly ShoppingItem[] = [],
  opciones: { archivada?: boolean } = {},
): ShoppingList {
  return ShoppingList.rehydrate(
    {
      id: LISTA_ID,
      nombre: "Semana",
      archivadaAt: opciones.archivada === true ? AHORA : null,
      createdAt: AHORA,
      updatedAt: AHORA,
    },
    items,
  );
}

export function listaVacia(opciones: { archivada?: boolean } = {}): ShoppingList {
  return lista([], opciones);
}
