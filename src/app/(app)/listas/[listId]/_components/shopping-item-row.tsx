import type { CantidadDto, ShoppingItemResponse } from "@/contracts/shopping";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { QuantityStepper } from "./quantity-stepper";
type Props = {
  item: ShoppingItemResponse;
  onToggle: (comprado: boolean) => void;
  onCantidad: (cantidad: CantidadDto) => void;
  onQuitar: () => void;
};
export function ShoppingItemRow({ item, onToggle, onCantidad, onQuitar }: Props) {
  const comprado = item.compradoAt !== null;
  return (
    <li className="flex items-center gap-3 py-2">
      <Checkbox
        checked={comprado}
        onCheckedChange={(valor) => onToggle(valor === true)}
        aria-label={
          comprado ? `Devolver ${item.nombre} a la lista` : `Marcar ${item.nombre} como comprado`
        }
      />
      <div className="min-w-0 flex-1">
        <p className={comprado ? "truncate text-muted-foreground line-through" : "truncate"}>
          {item.nombre}
        </p>
        {item.nota !== null && (
          <p className="truncate text-xs text-muted-foreground">{item.nota}</p>
        )}
      </div>
      <QuantityStepper cantidad={item.cantidad} onChange={onCantidad} disabled={comprado} />
      <Button variant="ghost" size="icon" onClick={onQuitar} aria-label={`Quitar ${item.nombre}`}>
        ✕
      </Button>
    </li>
  );
}
