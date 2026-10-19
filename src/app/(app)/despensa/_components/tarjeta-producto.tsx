"use client";
import { Menu } from "@base-ui/react/menu";
import { MoreVertical, Pencil, ShoppingCart, Trash2 } from "lucide-react";
import type { LineaDespensaResponse } from "@/contracts/pantry";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { formatDiaYMes } from "../../_components/fechas";
import { formatCantidad } from "../../listas/[listId]/_components/format-cantidad";
import { type ProductoDespensa, textoCaducidad } from "./vista-despensa";

type Props = {
  producto: ProductoDespensa;
  /** Por categoría se muestra la ubicación; por ubicación, la categoría ya está en el título. */
  detalle: string | null;
  onGastar: (linea: LineaDespensaResponse) => void;
  onEditar: (linea: LineaDespensaResponse) => void;
  onAnadirALista: (linea: LineaDespensaResponse) => void;
  onQuitar: (linea: LineaDespensaResponse) => void;
};

const COLOR: Record<LineaDespensaResponse["caducidad"]["estado"], string> = {
  caducado: "bg-destructive/10 text-destructive",
  pronto: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  ok: "bg-muted text-muted-foreground",
  sin_fecha: "",
};

function Caducidad({ linea }: { linea: LineaDespensaResponse }) {
  const texto = textoCaducidad(linea.caducidad);
  if (texto === null || linea.caducaEl === null) return null;
  return (
    <span
      className={cn(
        "self-start rounded-full px-2 py-0.5 text-xs font-semibold",
        COLOR[linea.caducidad.estado],
      )}
    >
      {linea.caducidad.estado === "ok"
        ? `Caduca el ${formatDiaYMes(`${linea.caducaEl}T12:00:00Z`)}`
        : texto}
    </span>
  );
}

const opcion =
  "flex h-11 cursor-default items-center gap-3 rounded-lg px-3 text-base outline-none select-none data-[highlighted]:bg-muted";

function MenuLinea({
  linea,
  onEditar,
  onAnadirALista,
  onQuitar,
}: Omit<Props, "producto" | "detalle" | "onGastar"> & { linea: LineaDespensaResponse }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Más acciones: ${linea.nombre}`}
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-[popup-open]:bg-muted"
      >
        <MoreVertical className="size-5" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={4} className="z-50">
          <Menu.Popup className="flex w-60 flex-col gap-1 rounded-xl bg-popover p-2 text-popover-foreground shadow-lg outline-none">
            <Menu.Item className={opcion} onClick={() => onEditar(linea)}>
              <Pencil className="size-5" aria-hidden="true" />
              Mover, fecha, categoría…
            </Menu.Item>
            <Menu.Item className={opcion} onClick={() => onAnadirALista(linea)}>
              <ShoppingCart className="size-5" aria-hidden="true" />
              Añadir a la lista
            </Menu.Item>
            <Menu.Item className={`${opcion} text-destructive`} onClick={() => onQuitar(linea)}>
              <Trash2 className="size-5" aria-hidden="true" />
              Quitar (añadido por error)
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** Un producto: con fechas distintas, una fila por lote; si no, una sola. */
export function TarjetaProducto({ producto, detalle, onGastar, ...acciones }: Props) {
  const varias = producto.lineas.length > 1;
  const principal = producto.principal;

  return (
    <li className="flex flex-col gap-2 rounded-xl bg-card p-3 shadow-card">
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
          <h3 className="text-lg leading-6 font-semibold break-words">{producto.nombre}</h3>
          <p className="text-sm text-muted-foreground">
            {producto.total ? formatCantidad(producto.total) : `${producto.lineas.length} lotes`}
            {detalle ? ` · ${detalle}` : ""}
            {principal.quedaPoco ? " · queda poco" : ""}
          </p>
          {!varias && <Caducidad linea={principal} />}
        </div>
        {!varias && (
          <>
            <Button onClick={() => onGastar(principal)} className="h-11 px-4 font-semibold">
              Gastar
            </Button>
            <MenuLinea linea={principal} {...acciones} />
          </>
        )}
      </div>
      {varias && (
        <ul className="flex flex-col divide-y rounded-lg bg-muted/50">
          {producto.lineas.map((l) => (
            <li key={l.id} className="flex items-center gap-2 py-1 pr-1 pl-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold">{formatCantidad(l.cantidad)}</span>
                {l.caducaEl === null ? (
                  <span className="text-xs text-muted-foreground">Sin fecha</span>
                ) : (
                  <Caducidad linea={l} />
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => onGastar(l)}
                className="h-11 px-3 font-semibold"
              >
                Gastar
              </Button>
              <MenuLinea linea={l} {...acciones} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
