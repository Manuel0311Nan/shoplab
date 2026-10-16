import type { CantidadDto } from "@/contracts/shopping";
import { Button } from "@/shared/ui/button";
import { formatCantidad, pasoDe } from "./format-cantidad";
type Props = {
  cantidad: CantidadDto;
  onChange: (cantidad: CantidadDto) => void;
  disabled?: boolean;
};
export function QuantityStepper({ cantidad, onChange, disabled = false }: Props) {
  const paso = pasoDe(cantidad.unidad);
  const cambiar = (delta: number) =>
    onChange({ ...cantidad, valor: Math.round((cantidad.valor + delta) * 1000) / 1000 });
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        aria-label="Menos"
        disabled={disabled || cantidad.valor - paso <= 0}
        onClick={() => cambiar(-paso)}
      >
        −
      </Button>
      <span className="w-16 text-center text-sm tabular-nums">{formatCantidad(cantidad)}</span>
      <Button
        variant="outline"
        size="icon"
        aria-label="Más"
        disabled={disabled}
        onClick={() => cambiar(paso)}
      >
        +
      </Button>
    </div>
  );
}
