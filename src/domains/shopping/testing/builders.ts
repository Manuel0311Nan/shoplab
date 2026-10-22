import { Cantidad } from "@/shared/kernel/cantidad";
import { ShoppingItem, type ShoppingItemSnapshot } from "@/domains/shopping/domain/shopping-item";
import { ShoppingList, type ShoppingListSnapshot } from "@/domains/shopping/domain/shopping-list";

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
    productoBaseId: null,
    categoria: "otros",
    cantidad: cantidad(1, "unidad"),
    unidadesPorPack: null,
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
  return listaCon({ archivadaAt: opciones.archivada === true ? AHORA : null }, items);
}

/** Una lista ya existente con los campos que el test necesite cambiar. */
export function listaCon(
  cambios: Partial<ShoppingListSnapshot> = {},
  items: readonly ShoppingItem[] = [],
): ShoppingList {
  return ShoppingList.rehydrate(
    {
      id: LISTA_ID,
      nombre: "Semana",
      archivadaAt: null,
      general: false,
      createdAt: AHORA,
      updatedAt: AHORA,
      deletedAt: null,
      ...cambios,
    },
    items,
  );
}

/** Un id de lista distinto para cada número (n de 1 a 99). */
export const listaId = (n: number) =>
  `0199c000-0000-7000-8000-0000000001${String(n).padStart(2, "0")}`;

/** Fecha AHORA desplazada n minutos. */
export const minutos = (n: number) => new Date(AHORA.getTime() + n * 60_000);

export function listaVacia(opciones: { archivada?: boolean } = {}): ShoppingList {
  return lista([], opciones);
}
