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
  return (
    <section aria-label={titulo}>
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">
        {titulo} ({items.length})
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{vacio}</p>
      ) : (
        <ul className="divide-y">
          {items.map((item) => (
            <ShoppingItemRow
              key={item.id}
              item={item}
              onToggle={(comprado: boolean) => onToggle(item.id, comprado)}
              onCantidad={(cantidad: {
                valor: number;
                unidad: "unidad" | "g" | "kg" | "ml" | "l";
              }) => onCantidad(item.id, cantidad)}
              onQuitar={() => onQuitar(item.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
