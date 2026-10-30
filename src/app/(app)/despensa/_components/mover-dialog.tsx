"use client";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import type { LineaDespensaResponse, UbicacionResponse } from "@/contracts/pantry";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { formatCantidad } from "../../listas/[listId]/_components/format-cantidad";

type Props = {
  linea: LineaDespensaResponse | null;
  ubicaciones: readonly UbicacionResponse[];
  /** Sin valor: toda la línea. */
  onMover: (linea: LineaDespensaResponse, ubicacionId: string, valor: number | undefined) => void;
  onCerrar: () => void;
};

const chip = (activo: boolean) =>
  cn(
    "h-11 shrink-0 rounded-full px-4 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    activo ? "bg-primary text-primary-foreground" : "bg-muted",
  );

/**
 * Llevar un producto a otro sitio: entero o solo una parte («de las 6 leches de avena,
 * 1 a la nevera»). La parte se queda con la misma caducidad.
 */
export function MoverDialog({ linea, ubicaciones, onMover, onCerrar }: Props) {
  return (
    <Dialog open={linea !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent>
        {linea && (
          <Formulario key={linea.id} linea={linea} ubicaciones={ubicaciones} onMover={onMover} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  linea,
  ubicaciones,
  onMover,
}: Omit<Props, "linea" | "onCerrar"> & { linea: LineaDespensaResponse }) {
  // Lo que está por organizar puede quedarse donde está: solo hay que confirmarlo.
  const destinos = linea.porOrganizar
    ? ubicaciones
    : ubicaciones.filter((u) => u.id !== linea.ubicacionId);
  const [ubicacionId, setUbicacionId] = useState(
    linea.porOrganizar ? linea.ubicacionId : (destinos.at(0)?.id ?? ""),
  );
  const total = linea.cantidad.valor;
  const enUnidades = linea.cantidad.unidad === "unidad";
  const sePuedePartir = enUnidades ? total > 1 : total > 0;
  const [texto, setTexto] = useState(String(total));
  const valor = Number(texto.replace(",", "."));
  const valido = Number.isFinite(valor) && valor > 0 && valor <= total;
  const todo = !valido || valor === total;
  const actual = ubicaciones.find((u) => u.id === linea.ubicacionId)?.nombre ?? "";
  const destino = ubicaciones.find((u) => u.id === ubicacionId)?.nombre ?? "";
  const cuanto = todo ? "todo" : formatCantidad({ valor, unidad: linea.cantidad.unidad });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (ubicacionId !== "" && valido) onMover(linea, ubicacionId, todo ? undefined : valor);
      }}
    >
      <DialogTitle>Mover {linea.nombre}</DialogTitle>
      <DialogDescription>
        {linea.porOrganizar ? "Por organizar" : `En ${actual}`} · {formatCantidad(linea.cantidad)}
      </DialogDescription>

      {destinos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay otra ubicación. Crea una desde la rueda de ajustes.
        </p>
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">¿A dónde?</legend>
          <div className="flex flex-wrap gap-2">
            {destinos.map((u) => (
              <button
                key={u.id}
                type="button"
                aria-pressed={ubicacionId === u.id}
                onClick={() => setUbicacionId(u.id)}
                className={chip(ubicacionId === u.id)}
              >
                {u.nombre}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {sePuedePartir && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">¿Cuánto?</legend>
          <div className="flex items-center gap-2">
            {enUnidades ? (
              <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                <button
                  type="button"
                  aria-label="Una menos"
                  disabled={!valido || valor <= 1}
                  onClick={() => setTexto(String(Math.max(1, Math.round(valor) - 1)))}
                  className="flex size-10 items-center justify-center rounded-full bg-card disabled:opacity-40"
                >
                  <Minus className="size-5" aria-hidden="true" />
                </button>
                <span
                  className="min-w-16 text-center font-semibold tabular-nums"
                  aria-live="polite"
                >
                  {valido ? valor : "—"} ud.
                </span>
                <button
                  type="button"
                  aria-label="Una más"
                  disabled={!valido || valor >= total}
                  onClick={() => setTexto(String(Math.min(total, Math.round(valor) + 1)))}
                  className="flex size-10 items-center justify-center rounded-full bg-card disabled:opacity-40"
                >
                  <Plus className="size-5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 text-sm font-semibold">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  max={total}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  aria-label="Cantidad a mover"
                  aria-invalid={!valido}
                  className="h-11 w-28 rounded-lg border-transparent bg-muted md:text-base"
                />
                {linea.cantidad.unidad}
              </label>
            )}
            <span className="text-sm text-muted-foreground">
              de {formatCantidad(linea.cantidad)}
            </span>
            <button
              type="button"
              aria-pressed={todo}
              onClick={() => setTexto(String(total))}
              className={cn(chip(todo), "ml-auto h-10")}
            >
              Todo
            </button>
          </div>
          {!valido && (
            <p className="text-sm font-medium text-destructive">
              Elige entre algo y {formatCantidad(linea.cantidad)}.
            </p>
          )}
        </fieldset>
      )}

      <Button type="submit" disabled={ubicacionId === "" || !valido} className="h-11 font-semibold">
        {linea.porOrganizar && ubicacionId === linea.ubicacionId && todo
          ? `Dejar en ${destino}`
          : `Mover ${cuanto} a ${destino}`}
      </Button>
      <DialogClose render={<Button type="button" variant="ghost" className="h-11 font-semibold" />}>
        Cancelar
      </DialogClose>
    </form>
  );
}
