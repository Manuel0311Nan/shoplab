import { Check, Undo2, X } from "lucide-react";
import type { CantidadDto, ShoppingItemResponse } from "@/contracts/shopping";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { QuantityStepper } from "./quantity-stepper";

type Props = {
  item: ShoppingItemResponse;
  onToggle: (comprado: boolean) => void;
  onCantidad: (cantidad: CantidadDto) => void;
  onQuitar: () => void;
  soloLectura?: boolean;
};

// Hasta que el ítem se vincule a un Ingredient con categoría (vista 3),
// el círculo del diseño muestra la inicial en lugar de un icono.
const inicial = (nombre: string) => nombre.trim().charAt(0).toLocaleUpperCase("es-ES");

export function ShoppingItemRow({
  item,
  onToggle,
  onCantidad,
  onQuitar,
  soloLectura = false,
}: Props) {
  const comprado = item.compradoAt !== null;
  return (
    <li
      className={cn(
        "flex min-w-0 flex-col rounded-xl p-3 transition-transform active:scale-[0.98] sm:p-4",
        comprado ? "bg-muted" : "bg-card shadow-card",
      )}
    >
      <div className="mb-3 flex items-start justify-between">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-12 items-center justify-center rounded-full font-heading text-xl font-bold",
            comprado ? "bg-card text-muted-foreground" : "bg-muted text-primary",
          )}
        >
          {inicial(item.nombre)}
        </span>
        {!soloLectura && (
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={onQuitar}
            aria-label={`Quitar ${item.nombre}`}
            className="-mt-1.5 -mr-1.5 size-11 rounded-full text-muted-foreground [&_svg:not([class*='size-'])]:size-5"
          >
            <X aria-hidden="true" />
          </Button>
        )}
      </div>
      <h3
        className={cn(
          "truncate text-lg leading-7 font-semibold",
          comprado && "text-muted-foreground line-through",
        )}
      >
        {item.nombre}
      </h3>
      <p className="min-h-4 truncate text-xs text-muted-foreground">{item.nota}</p>
      <div className="mt-3">
        <QuantityStepper
          nombre={item.nombre}
          cantidad={item.cantidad}
          onChange={onCantidad}
          disabled={comprado || soloLectura}
        />
      </div>
      {!soloLectura && (
        <Button
          variant={comprado ? "outline" : "default"}
          onClick={() => onToggle(!comprado)}
          className="mt-4 h-11 w-full font-semibold"
        >
          {comprado ? <Undo2 aria-hidden="true" /> : <Check aria-hidden="true" />}
          {comprado ? "Devolver" : "Al carro"}
          <span className="sr-only">: {item.nombre}</span>
        </Button>
      )}
    </li>
  );
}
