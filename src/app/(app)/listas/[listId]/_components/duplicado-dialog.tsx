"use client";
import { useState } from "react";
import type { CantidadDto, DuplicadoDetails, UnidadDto } from "@/contracts/shopping";
import { Cantidad, sonConvertibles, sumarCantidades } from "@/shared/kernel/cantidad";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { formatCantidad } from "./format-cantidad";

export type RespuestaUnir = { unidadFinal?: UnidadDto; cantidadFinal?: CantidadDto };

export interface EstadoDuplicado {
  readonly existente: DuplicadoDetails["existente"];
  readonly nueva: CantidadDto;
  /** "decidir": POSIBLE_DUPLICADO. "unidad": al unir, las unidades no coinciden. */
  readonly paso: "decidir" | "unidad";
}

type Props = {
  estado: EstadoDuplicado | null;
  onUnir: (respuesta: RespuestaUnir) => void;
  onSeparar: () => void;
  onCerrar: () => void;
};

/**
 * D4: un producto que parece repetido. Primero se pregunta si unirlo o añadirlo aparte;
 * si al unir las unidades no coinciden, se elige la unidad (g/kg, ml/l: se convierte) o
 * se escribe el total (familias distintas: «2 ud.» y «1 l» no se pueden sumar).
 */
export function DuplicadoDialog({ estado, onUnir, onSeparar, onCerrar }: Props) {
  return (
    <Dialog open={estado !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent>
        {estado?.paso === "decidir" && (
          <Decidir estado={estado} onUnir={() => onUnir({})} onSeparar={onSeparar} />
        )}
        {estado?.paso === "unidad" && <ElegirUnidad estado={estado} onUnir={onUnir} />}
        <DialogClose render={<Button variant="ghost" className="h-11 font-semibold" />}>
          Cancelar
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

function Decidir({
  estado,
  onUnir,
  onSeparar,
}: {
  estado: EstadoDuplicado;
  onUnir: () => void;
  onSeparar: () => void;
}) {
  const { existente, nueva } = estado;
  return (
    <>
      <DialogTitle>Ya tienes «{existente.nombre}»</DialogTitle>
      <DialogDescription>
        {existente.comprado
          ? `Está en el carro (${formatCantidad(existente.cantidad)}). Si lo unes, vuelve a «Por comprar» con ${formatCantidad(nueva)}.`
          : `Tienes ${formatCantidad(existente.cantidad)} por comprar. ¿Le sumas ${formatCantidad(nueva)} o lo añades aparte?`}
      </DialogDescription>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onUnir} className="h-11 font-semibold sm:flex-1">
          Unir
        </Button>
        <Button variant="outline" onClick={onSeparar} className="h-11 font-semibold sm:flex-1">
          Añadir aparte
        </Button>
      </div>
    </>
  );
}

function ElegirUnidad({
  estado,
  onUnir,
}: {
  estado: EstadoDuplicado;
  onUnir: (respuesta: RespuestaUnir) => void;
}) {
  const { existente, nueva } = estado;
  const [valor, setValor] = useState("");
  const [unidad, setUnidad] = useState<UnidadDto>(nueva.unidad);

  if (sonConvertibles(existente.cantidad.unidad, nueva.unidad)) {
    const opciones = [...new Set([existente.cantidad.unidad, nueva.unidad])];
    const sumandos = [existente.cantidad, nueva].flatMap((c) => {
      const r = Cantidad.create(c.valor, c.unidad);
      return r.ok ? [r.value] : [];
    });
    return (
      <>
        <DialogTitle>¿En qué unidad lo cuento?</DialogTitle>
        <DialogDescription>
          {formatCantidad(existente.cantidad)} + {formatCantidad(nueva)} de {existente.nombre}.
        </DialogDescription>
        <div className="flex flex-col gap-2 sm:flex-row">
          {opciones.map((u) => {
            const total = sumarCantidades(sumandos, u);
            return (
              <Button
                key={u}
                variant="outline"
                disabled={total === null}
                onClick={() => onUnir({ unidadFinal: u })}
                className="h-11 text-base font-semibold sm:flex-1"
              >
                {total ? formatCantidad(total) : u}
              </Button>
            );
          })}
        </div>
      </>
    );
  }

  const numero = Number(valor.replace(",", "."));
  const valido = valor.trim() !== "" && Number.isFinite(numero) && numero > 0;
  return (
    <>
      <DialogTitle>¿Es el mismo producto?</DialogTitle>
      <DialogDescription>
        Tienes {formatCantidad(existente.cantidad)} y añades {formatCantidad(nueva)}: no se pueden
        sumar solas. Si es lo mismo, escribe cuánto quieres en total.
      </DialogDescription>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (valido) onUnir({ cantidadFinal: { valor: numero, unidad } });
        }}
      >
        <Input
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          aria-label="Cantidad total"
          autoFocus
          className="h-11 w-24 rounded-lg border-transparent bg-muted md:text-base"
        />
        <select
          aria-label="Unidad del total"
          value={unidad}
          onChange={(e) => setUnidad(e.target.value as UnidadDto)}
          className="h-11 rounded-lg bg-muted px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {[...new Set([existente.cantidad.unidad, nueva.unidad])].map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={!valido} className="h-11 flex-1 font-semibold">
          Unir
        </Button>
      </form>
    </>
  );
}
