"use client";
import { useState } from "react";
import type { LineaDespensaResponse, MotivoConsumoDto } from "@/contracts/pantry";
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
  /** valor undefined = todo. */
  onConsumir: (
    linea: LineaDespensaResponse,
    valor: number | undefined,
    motivo: MotivoConsumoDto,
  ) => void;
  onCerrar: () => void;
};

/** Gastar o tirar (D7). Por defecto 1 ud.; en kg, l… lo que queda. */
export function ConsumirDialog({ linea, onConsumir, onCerrar }: Props) {
  return (
    <Dialog open={linea !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent>
        {linea && <Formulario key={linea.id} linea={linea} onConsumir={onConsumir} />}
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  linea,
  onConsumir,
}: {
  linea: LineaDespensaResponse;
  onConsumir: Props["onConsumir"];
}) {
  const porDefecto =
    linea.cantidad.unidad === "unidad" ? Math.min(1, linea.cantidad.valor) : linea.cantidad.valor;
  const [texto, setTexto] = useState(String(porDefecto));
  const valor = Number(texto.replace(",", "."));
  const valido = Number.isFinite(valor) && valor > 0 && valor <= linea.cantidad.valor;
  const todo = valido && valor === linea.cantidad.valor;

  const enviar = (motivo: MotivoConsumoDto) =>
    valido && onConsumir(linea, todo ? undefined : valor, motivo);

  return (
    <>
      <DialogTitle>{linea.nombre}</DialogTitle>
      <DialogDescription>
        Quedan {formatCantidad(linea.cantidad)}. ¿Cuánto has usado o tirado?
      </DialogDescription>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          max={linea.cantidad.valor}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-label={`Cantidad en ${linea.cantidad.unidad}`}
          aria-invalid={!valido}
          className="h-11 w-28 rounded-lg border-transparent bg-muted md:text-base"
        />
        <span className="text-muted-foreground">
          {linea.cantidad.unidad === "unidad" ? "ud." : linea.cantidad.unidad}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={() => setTexto(String(linea.cantidad.valor))}
          className="ml-auto h-11 px-4 font-semibold"
        >
          Todo
        </Button>
      </div>
      {!valido && (
        <p className="text-sm font-medium text-destructive">
          Escribe una cantidad entre 0 y {formatCantidad(linea.cantidad)}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={() => enviar("gastado")}
          disabled={!valido}
          className="h-11 font-semibold sm:flex-1"
        >
          Gastado
        </Button>
        <Button
          variant="destructive"
          onClick={() => enviar("tirado")}
          disabled={!valido}
          className="h-11 font-semibold sm:flex-1"
        >
          Tirado
        </Button>
      </div>
      <DialogClose render={<Button variant="ghost" className="h-11 font-semibold" />}>
        Cancelar
      </DialogClose>
    </>
  );
}
