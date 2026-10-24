"use client";
import {
  Minus,
  PackageOpen,
  Pencil,
  ShoppingCart,
  TextCursorInput,
  Trash2,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import type { LineaDespensaResponse } from "@/contracts/pantry";
import { sePuedeAbrir } from "@/shared/kernel/abierto";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { formatCantidad } from "../../listas/[listId]/_components/format-cantidad";
import { type ProductoDespensa, textoAbierto, textoCaducidad } from "./vista-despensa";

type Accion = (linea: LineaDespensaResponse) => void;

type Props = {
  producto: ProductoDespensa | null;
  onGastar: Accion;
  onAbrir: Accion;
  onCerrarAbierto: Accion;
  onEditar: Accion;
  onRenombrar: Accion;
  onAnadirALista: Accion;
  onQuitar: Accion;
  onCerrar: () => void;
};

const opcion =
  "flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-base outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Lo que sale al mantener pulsada una casilla de la despensa: todas las acciones del
 * producto. Con varios lotes (fechas distintas), primero se elige cuál.
 */
export function AccionesProductoDialog({ producto, onCerrar, ...acciones }: Props) {
  return (
    <Dialog open={producto !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent>
        {producto && (
          <Contenido key={producto.clave} producto={producto} onCerrar={onCerrar} {...acciones} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function detalleLinea(l: LineaDespensaResponse): string {
  return [formatCantidad(l.cantidad), textoCaducidad(l.caducidad), textoAbierto(l.abierto)]
    .filter((t) => t !== null)
    .join(" · ");
}

function Contenido({
  producto,
  onCerrar,
  onGastar,
  onAbrir,
  onCerrarAbierto,
  onEditar,
  onRenombrar,
  onAnadirALista,
  onQuitar,
}: Omit<Props, "producto"> & { producto: ProductoDespensa }) {
  const [lineaId, setLineaId] = useState(producto.principal.id);
  const linea = producto.lineas.find((l) => l.id === lineaId) ?? producto.principal;
  const hacer = (accion: Accion) => () => {
    onCerrar();
    accion(linea);
  };

  return (
    <>
      <DialogTitle>{producto.nombre}</DialogTitle>
      <DialogDescription>{detalleLinea(linea)}</DialogDescription>
      {producto.lineas.length > 1 && (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm font-semibold">¿Cuál?</legend>
          {producto.lineas.map((l) => (
            <label
              key={l.id}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 py-1.5 text-sm",
                l.id === linea.id ? "bg-accent" : "bg-muted",
              )}
            >
              <input
                type="radio"
                name="lote"
                checked={l.id === linea.id}
                onChange={() => setLineaId(l.id)}
                className="size-4 accent-primary"
              />
              {detalleLinea(l)}
            </label>
          ))}
        </fieldset>
      )}
      <div className="flex flex-col">
        <button type="button" className={opcion} onClick={hacer(onGastar)}>
          <Minus className="size-5" aria-hidden="true" />
          Gastar o tirar…
        </button>
        {linea.abierto === null && sePuedeAbrir(linea.categoria) && (
          <button type="button" className={opcion} onClick={hacer(onAbrir)}>
            <PackageOpen className="size-5" aria-hidden="true" />
            Lo he abierto
          </button>
        )}
        {linea.abierto !== null && (
          <button type="button" className={opcion} onClick={hacer(onCerrarAbierto)}>
            <Undo2 className="size-5" aria-hidden="true" />
            No está abierto
          </button>
        )}
        <button type="button" className={opcion} onClick={hacer(onEditar)}>
          <Pencil className="size-5" aria-hidden="true" />
          Mover, fecha, categoría…
        </button>
        <button type="button" className={opcion} onClick={hacer(onRenombrar)}>
          <TextCursorInput className="size-5" aria-hidden="true" />
          Cambiar nombre
        </button>
        <button type="button" className={opcion} onClick={hacer(onAnadirALista)}>
          <ShoppingCart className="size-5" aria-hidden="true" />
          Añadir a la lista
        </button>
        <button type="button" className={cn(opcion, "text-destructive")} onClick={hacer(onQuitar)}>
          <Trash2 className="size-5" aria-hidden="true" />
          Quitar (añadido por error)
        </button>
      </div>
      <DialogClose render={<Button variant="ghost" className="h-11 font-semibold" />}>
        Cancelar
      </DialogClose>
    </>
  );
}
