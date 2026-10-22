import { Check, Layers, Pencil, Undo2, X } from "lucide-react";
import type { CategoriaDto } from "@/contracts/categoria";
import type { CantidadDto, ShoppingItemResponse } from "@/contracts/shopping";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { SelectorCategoria } from "../../../_components/selector-categoria";
import { QuantityStepper } from "./quantity-stepper";

type Props = {
  item: ShoppingItemResponse;
  onToggle: (comprado: boolean) => void;
  onCantidad: (cantidad: CantidadDto) => void;
  onCategoria: (categoria: CategoriaDto) => void;
  onQuitar: () => void;
  /** Corregir el nombre (o estandarizarlo en todo el hogar). */
  onEditar?: () => void;
  soloLectura?: boolean;
  /** En la lista general: de qué lista viene (null si es de la propia general). */
  origen?: string | null;
};

/**
 * Un producto de la lista, con el mismo esquema que las tarjetas de la despensa: a lo
 * ancho, nombre completo (salta de línea, nunca se corta) y la acción principal a la
 * derecha; debajo, la cantidad.
 */
export function ShoppingItemRow({
  item,
  onToggle,
  onCantidad,
  onCategoria,
  onQuitar,
  onEditar,
  soloLectura = false,
  origen = null,
}: Props) {
  const comprado = item.compradoAt !== null;
  return (
    <li
      className={cn(
        "flex min-h-32 flex-col gap-3 rounded-xl p-3",
        comprado ? "bg-muted" : "bg-card shadow-card",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
          <h3
            className={cn(
              "text-lg leading-6 font-semibold break-words",
              comprado && "text-muted-foreground line-through",
            )}
          >
            {soloLectura || onEditar === undefined ? (
              item.nombre
            ) : (
              <button
                type="button"
                onClick={onEditar}
                className="-mx-1 rounded-md px-1 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {item.nombre}
                <Pencil
                  className="ml-1.5 inline size-4 align-[-2px] text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="sr-only">: editar</span>
              </button>
            )}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <SelectorCategoria
              categoria={item.categoria}
              producto={item.nombre}
              onCambiar={onCategoria}
              disabled={soloLectura}
            />
            {origen !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                <Layers className="size-3" aria-hidden="true" />
                {origen}
              </span>
            )}
          </div>
          {item.nota && <p className="text-xs break-words text-muted-foreground">{item.nota}</p>}
        </div>
        {!soloLectura && (
          <>
            <Button
              variant={comprado ? "outline" : "default"}
              onClick={() => onToggle(!comprado)}
              className="h-11 shrink-0 px-3 font-semibold"
            >
              {comprado ? <Undo2 aria-hidden="true" /> : <Check aria-hidden="true" />}
              {comprado ? "Devolver" : "Al carro"}
              <span className="sr-only">: {item.nombre}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={onQuitar}
              aria-label={`Quitar ${item.nombre}`}
              className="size-11 shrink-0 rounded-full text-muted-foreground [&_svg:not([class*='size-'])]:size-5"
            >
              <X aria-hidden="true" />
            </Button>
          </>
        )}
      </div>
      <div className="w-full max-w-60">
        <QuantityStepper
          nombre={item.nombre}
          cantidad={item.cantidad}
          unidadesPorPack={item.unidadesPorPack}
          onChange={onCantidad}
          disabled={comprado || soloLectura}
        />
      </div>
    </li>
  );
}
