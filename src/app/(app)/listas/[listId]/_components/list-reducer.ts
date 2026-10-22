import type { CategoriaDto } from "@/contracts/categoria";
import type {
  CantidadDto,
  ModoTerminarCompraDto,
  ShoppingItemResponse,
} from "@/contracts/shopping";
export type AccionLista =
  | { readonly tipo: "anadir"; readonly item: ShoppingItemResponse }
  | { readonly tipo: "comprado"; readonly itemId: string; readonly comprado: boolean }
  | { readonly tipo: "cantidad"; readonly itemId: string; readonly cantidad: CantidadDto }
  | { readonly tipo: "categoria"; readonly itemId: string; readonly categoria: CategoriaDto }
  | { readonly tipo: "quitar"; readonly itemId: string }
  | {
      readonly tipo: "renombrar";
      readonly itemId: string;
      readonly nombre: string;
      readonly productoBaseId: string | null;
    }
  | { readonly tipo: "terminar"; readonly modo: ModoTerminarCompraDto };
export function aplicarAccion(
  items: ShoppingItemResponse[],
  accion: AccionLista,
): ShoppingItemResponse[] {
  switch (accion.tipo) {
    case "anadir":
      return [...items, accion.item];
    case "comprado":
      return items.map((item) =>
        item.id === accion.itemId
          ? { ...item, compradoAt: accion.comprado ? new Date().toISOString() : null }
          : item,
      );
    case "cantidad":
      return items.map((item) =>
        item.id === accion.itemId ? { ...item, cantidad: accion.cantidad } : item,
      );
    case "categoria":
      return items.map((item) =>
        item.id === accion.itemId ? { ...item, categoria: accion.categoria } : item,
      );
    case "quitar":
      return items.filter((item) => item.id !== accion.itemId);
    case "renombrar":
      return items.map((item) =>
        item.id === accion.itemId
          ? { ...item, nombre: accion.nombre, productoBaseId: accion.productoBaseId }
          : item,
      );
    case "terminar":
      return accion.modo === "vaciar" ? [] : items.filter((item) => item.compradoAt === null);
  }
}
