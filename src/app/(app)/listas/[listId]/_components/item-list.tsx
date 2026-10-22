import { useId } from "react";
import type { CategoriaDto } from "@/contracts/categoria";
import type { CantidadDto, ShoppingItemResponse } from "@/contracts/shopping";
import type { EmojisProductos } from "@/contracts/memoria";
import { NOMBRE_CATEGORIA } from "@/shared/kernel/categoria";
import { emojiDe } from "../../../_components/emoji-producto";
import { agruparPorCategoria } from "./agrupar-por-categoria";
import { ShoppingItemRow } from "./shopping-item-row";

type Props = {
  titulo: string;
  vacio: string;
  items: readonly ShoppingItemResponse[];
  onToggle: (itemId: string, comprado: boolean) => void;
  onCantidad: (itemId: string, cantidad: CantidadDto) => void;
  onCategoria: (itemId: string, categoria: CategoriaDto) => void;
  onQuitar: (itemId: string) => void;
  onEditar?: (item: ShoppingItemResponse) => void;
  /** Emojis elegidos por el hogar (los de por defecto salen del nombre). */
  emojis?: EmojisProductos;
  /** Agrupar por categoría, en el orden del súper. */
  agrupar?: boolean;
  /** Lista archivada: se ve, pero no se puede cambiar. */
  soloLectura?: boolean;
  /** En la lista general: el id de la general (los ítems de otras listas llevan su nombre). */
  generalId?: string | null;
};

export function ItemList({
  titulo,
  vacio,
  items,
  onToggle,
  onCantidad,
  onCategoria,
  onQuitar,
  onEditar,
  emojis = {},
  agrupar = false,
  soloLectura = false,
  generalId = null,
}: Props) {
  const tituloId = useId();
  const fila = (item: ShoppingItemResponse) => (
    <ShoppingItemRow
      key={item.id}
      item={item}
      onToggle={(comprado) => onToggle(item.id, comprado)}
      onCantidad={(cantidad) => onCantidad(item.id, cantidad)}
      onCategoria={(categoria) => onCategoria(item.id, categoria)}
      onQuitar={() => onQuitar(item.id)}
      {...(onEditar === undefined ? {} : { onEditar: () => onEditar(item) })}
      soloLectura={soloLectura}
      emoji={emojiDe(emojis, item.nombre)}
      origen={
        generalId !== null && item.listaId !== undefined && item.listaId !== generalId
          ? (item.listaNombre ?? null)
          : null
      }
    />
  );
  const rejilla = "flex flex-col gap-2";

  return (
    <section aria-labelledby={tituloId} className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 id={tituloId} className="text-xl font-semibold">
          {titulo}
        </h2>
        <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          {vacio}
        </p>
      ) : agrupar ? (
        agruparPorCategoria(items).map((grupo) => (
          <div key={grupo.categoria} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {NOMBRE_CATEGORIA[grupo.categoria]}
            </h3>
            <ul className={rejilla}>{grupo.items.map(fila)}</ul>
          </div>
        ))
      ) : (
        <ul className={rejilla}>{items.map(fila)}</ul>
      )}
    </section>
  );
}
