import { Minus, Plus } from "lucide-react";
import type { CantidadDto } from "@/contracts/shopping";
import { Button } from "@/shared/ui/button";
import { formatCantidadItem, pasoDe } from "./format-cantidad";

// 40 px visibles + un área invisible que llega a 44 px (objetivo táctil mínimo).
const TACTIL =
  "relative size-10 rounded-full hover:bg-card after:absolute after:-inset-0.5 after:content-['']";

type Props = {
  /** Nombre del producto, para que los botones tengan una etiqueta única. */
  nombre: string;
  cantidad: CantidadDto;
  onChange: (cantidad: CantidadDto) => void;
  disabled?: boolean;
  /** Por packs: el paso es un pack entero. */
  unidadesPorPack?: number | null;
};

export function QuantityStepper({
  nombre,
  cantidad,
  onChange,
  disabled = false,
  unidadesPorPack = null,
}: Props) {
  const paso = unidadesPorPack ?? pasoDe(cantidad.unidad);
  const cambiar = (delta: number) =>
    onChange({ ...cantidad, valor: Math.round((cantidad.valor + delta) * 1000) / 1000 });
  return (
    <div className="flex items-center justify-between gap-0.5 rounded-full bg-muted p-0.5">
      <Button
        variant="ghost"
        size="icon-lg"
        className={TACTIL}
        aria-label={`Menos ${nombre}`}
        disabled={disabled || cantidad.valor - paso <= 0}
        onClick={() => cambiar(-paso)}
      >
        <Minus aria-hidden="true" />
      </Button>
      <span className="min-w-0 flex-1 truncate text-center text-sm font-semibold tabular-nums">
        {formatCantidadItem(cantidad, unidadesPorPack)}
      </span>
      <Button
        variant="ghost"
        size="icon-lg"
        className={TACTIL}
        aria-label={`Más ${nombre}`}
        disabled={disabled}
        onClick={() => cambiar(paso)}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}
