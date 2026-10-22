"use client";
import { Check, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import type { CantidadDto, ShoppingItemResponse } from "@/contracts/shopping";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { IconoCategoria } from "../../../_components/icono-categoria";
import { usePulsacionLarga } from "../../../_components/pulsacion-larga";
import { agruparPorCategoria } from "./agrupar-por-categoria";
import { cantidadCorta } from "./format-cantidad";
import { QuantityStepper } from "./quantity-stepper";

type Props = {
  pendientes: readonly ShoppingItemResponse[];
  enElCarro: readonly ShoppingItemResponse[];
  agrupar: boolean;
  soloLectura: boolean;
  onToggle: (itemId: string, comprado: boolean) => void;
  onCantidad: (itemId: string, cantidad: CantidadDto) => void;
  onQuitar: (itemId: string) => void;
};

/**
 * Vista rápida para comprar deprisa: una cuadrícula con solo el producto. Un toque lo
 * manda al carro (y en el carro, lo devuelve); mantener pulsado deja cambiar la
 * cantidad o quitarlo. La cantidad, si no es 1 ud., va en la esquina.
 */
export function VistaRapida({
  pendientes,
  enElCarro,
  agrupar,
  soloLectura,
  onToggle,
  onCantidad,
  onQuitar,
}: Props) {
  const [ajustarId, setAjustarId] = useState<string | null>(null);
  const ajustar = [...pendientes, ...enElCarro].find((i) => i.id === ajustarId) ?? null;
  const ayudaId = useId();

  const casilla = (item: ShoppingItemResponse, comprado: boolean) => (
    <Casilla
      key={item.id}
      item={item}
      comprado={comprado}
      soloLectura={soloLectura}
      ayudaId={ayudaId}
      onToque={() => {
        vibrar();
        onToggle(item.id, !comprado);
      }}
      onLarga={() => setAjustarId(item.id)}
    />
  );
  const rejilla = "grid grid-cols-3 gap-2 sm:grid-cols-4";
  // Por categoría: en el orden del súper, pero seguidas (sin títulos que dejen huecos).
  const ordenados = agrupar ? agruparPorCategoria(pendientes).flatMap((g) => g.items) : pendientes;

  return (
    <div className="flex flex-col gap-6">
      <p id={ayudaId} className="sr-only">
        Toca para pasarlo al carro o devolverlo. Mantén pulsado para cambiar la cantidad.
      </p>
      <Seccion titulo="Por comprar" total={pendientes.length}>
        {pendientes.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            No queda nada por comprar.
          </p>
        ) : (
          <ul className={rejilla}>{ordenados.map((i) => casilla(i, false))}</ul>
        )}
      </Seccion>
      {enElCarro.length > 0 && (
        <Seccion titulo="En el carro" total={enElCarro.length}>
          <ul className={rejilla}>{enElCarro.map((i) => casilla(i, true))}</ul>
        </Seccion>
      )}

      <AjustarDialog
        item={ajustar}
        onCantidad={onCantidad}
        onQuitar={(id) => {
          setAjustarId(null);
          onQuitar(id);
        }}
        onCerrar={() => setAjustarId(null)}
      />
    </div>
  );
}

function Seccion({
  titulo,
  total,
  children,
}: {
  titulo: string;
  total: number;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 id={id} className="text-xl font-semibold">
          {titulo}
        </h2>
        <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
          {total}
        </span>
      </div>
      {children}
    </section>
  );
}

function Casilla({
  item,
  comprado,
  soloLectura,
  ayudaId,
  onToque,
  onLarga,
}: {
  item: ShoppingItemResponse;
  comprado: boolean;
  soloLectura: boolean;
  ayudaId: string;
  onToque: () => void;
  onLarga: () => void;
}) {
  const pulsacion = usePulsacionLarga({ onCorta: onToque, onLarga });
  const cantidad = cantidadCorta(item.cantidad, item.unidadesPorPack);

  return (
    <li>
      <button
        type="button"
        disabled={soloLectura}
        {...pulsacion}
        aria-describedby={ayudaId}
        className={cn(
          "relative flex size-full min-h-28 flex-col items-center justify-center gap-1.5 rounded-xl p-2 pt-4 text-center outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 disabled:opacity-60 motion-safe:transition-transform",
          comprado ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        {cantidad !== null && (
          <span
            className={cn(
              "absolute top-1.5 right-1.5 max-w-[calc(100%-0.75rem)] truncate rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums",
              comprado ? "bg-card text-muted-foreground" : "bg-card text-foreground",
            )}
          >
            {cantidad}
          </span>
        )}
        {comprado ? (
          <Check className="size-8" aria-hidden="true" />
        ) : (
          <IconoCategoria categoria={item.categoria} className="size-9" />
        )}
        <span className="text-sm leading-tight font-semibold break-words hyphens-auto">
          {item.nombre}
        </span>
        <span className="sr-only">
          {cantidad !== null ? `, ${cantidad}` : ""}
          {comprado ? ": en el carro, toca para devolverlo" : ": toca para pasarlo al carro"}
        </span>
      </button>
    </li>
  );
}

function AjustarDialog({
  item,
  onCantidad,
  onQuitar,
  onCerrar,
}: {
  item: ShoppingItemResponse | null;
  onCantidad: (itemId: string, cantidad: CantidadDto) => void;
  onQuitar: (itemId: string) => void;
  onCerrar: () => void;
}) {
  return (
    <Dialog open={item !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent>
        {item && (
          <>
            <DialogTitle>{item.nombre}</DialogTitle>
            <DialogDescription>Cambia la cantidad o quítalo de la lista.</DialogDescription>
            <QuantityStepper
              nombre={item.nombre}
              cantidad={item.cantidad}
              unidadesPorPack={item.unidadesPorPack}
              onChange={(c) => onCantidad(item.id, c)}
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => onQuitar(item.id)}
                className="h-11 flex-1 font-semibold text-destructive"
              >
                <Trash2 aria-hidden="true" />
                Quitar
              </Button>
              <DialogClose render={<Button className="h-11 flex-1 font-semibold" />}>
                Hecho
              </DialogClose>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Una vibración corta al tocar, donde el navegador lo permite (Android). */
function vibrar() {
  try {
    navigator.vibrate?.(10);
  } catch {
    // Sin vibración no pasa nada.
  }
}
