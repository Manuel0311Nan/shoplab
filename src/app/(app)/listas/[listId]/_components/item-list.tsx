import { useId } from "react";
import type { CantidadDto, ShoppingItemResponse } from "@/contracts/shopping";
import { ShoppingItemRow } from "./shopping-item-row";

type Props = {
  titulo: string;
  vacio: string;
  items: readonly ShoppingItemResponse[];
  onToggle: (itemId: string, comprado: boolean) => void;
  onCantidad: (itemId: string, cantidad: CantidadDto) => void;
  onQuitar: (itemId: string) => void;
};

export function ItemList({ titulo, vacio, items, onToggle, onCantidad, onQuitar }: Props) {
  const tituloId = useId();
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
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <ShoppingItemRow
              key={item.id}
              item={item}
              onToggle={(comprado) => onToggle(item.id, comprado)}
              onCantidad={(cantidad) => onCantidad(item.id, cantidad)}
              onQuitar={() => onQuitar(item.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
