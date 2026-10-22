"use client";
import { Menu } from "@base-ui/react/menu";
import {
  Minus,
  MoreVertical,
  PackageOpen,
  Pencil,
  ShoppingCart,
  TextCursorInput,
  Trash2,
  Undo2,
} from "lucide-react";
import type { ColorAbiertoDto, LineaDespensaResponse } from "@/contracts/pantry";
import { sePuedeAbrir } from "@/shared/kernel/abierto";
import { cn } from "@/shared/lib/utils";
import { BotonGastar } from "./boton-gastar";
import { formatDiaYMes } from "../../_components/fechas";
import { formatCantidad } from "../../listas/[listId]/_components/format-cantidad";
import { type ProductoDespensa, textoAbierto, textoCaducidad } from "./vista-despensa";

type Props = {
  producto: ProductoDespensa;
  /** Por categoría se muestra la ubicación; por ubicación, la categoría ya está en el título. */
  detalle: string | null;
  /** Abre el diálogo: gastar varias, en g/kg/l, o tirar. */
  onGastar: (linea: LineaDespensaResponse) => void;
  /** Un toque: 1 ud. gastada (con «Deshacer»). */
  onGastarUno: (linea: LineaDespensaResponse) => void;
  onEditar: (linea: LineaDespensaResponse) => void;
  onAnadirALista: (linea: LineaDespensaResponse) => void;
  onQuitar: (linea: LineaDespensaResponse) => void;
  onAbrir: (linea: LineaDespensaResponse) => void;
  onCerrarAbierto: (linea: LineaDespensaResponse) => void;
  /** Corregir el nombre (o estandarizarlo en todo el hogar). */
  onRenombrar: (linea: LineaDespensaResponse) => void;
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

const COLOR_ABIERTO: Record<ColorAbiertoDto, string> = {
  verde: "bg-secondary text-secondary-foreground",
  amarillo: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  rojo: "bg-destructive/10 text-destructive",
};

/** Paquete abierto: verde, amarillo («revísalo») o rojo según los días que lleva. */
function Abierto({ linea }: { linea: LineaDespensaResponse }) {
  const texto = textoAbierto(linea.abierto);
  if (texto === null || linea.abierto === null) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 self-start rounded-full px-2 py-0.5 text-xs font-semibold",
        COLOR_ABIERTO[linea.abierto.color],
      )}
    >
      <PackageOpen className="size-3.5" aria-hidden="true" />
      {texto}
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
  onAbrir,
  onCerrarAbierto,
  onRenombrar,
  onGastar,
}: Omit<Props, "producto" | "detalle" | "onGastarUno"> & { linea: LineaDespensaResponse }) {
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
            <Menu.Item className={opcion} onClick={() => onGastar(linea)}>
              <Minus className="size-5" aria-hidden="true" />
              Gastar o tirar…
            </Menu.Item>
            <Menu.Item className={opcion} onClick={() => onEditar(linea)}>
              <Pencil className="size-5" aria-hidden="true" />
              Mover, fecha, categoría…
            </Menu.Item>
            <Menu.Item className={opcion} onClick={() => onRenombrar(linea)}>
              <TextCursorInput className="size-5" aria-hidden="true" />
              Cambiar nombre
            </Menu.Item>
            {linea.abierto === null && sePuedeAbrir(linea.categoria) && (
              <Menu.Item className={opcion} onClick={() => onAbrir(linea)}>
                <PackageOpen className="size-5" aria-hidden="true" />
                Lo he abierto
              </Menu.Item>
            )}
            {linea.abierto !== null && (
              <Menu.Item className={opcion} onClick={() => onCerrarAbierto(linea)}>
                <Undo2 className="size-5" aria-hidden="true" />
                No está abierto
              </Menu.Item>
            )}
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
export function TarjetaProducto({ producto, detalle, onGastarUno, ...acciones }: Props) {
  const varias = producto.lineas.length > 1;
  const principal = producto.principal;

  return (
    <li className="flex flex-col gap-2 rounded-xl bg-card p-3 shadow-card">
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
          <h3 className="text-lg leading-6 font-semibold break-words">{producto.nombre}</h3>
          <p className="text-sm text-muted-foreground">
            {/* La clave reinicia la animación cuando cambia la cantidad (al gastar). */}
            <span
              key={producto.total ? formatCantidad(producto.total) : producto.lineas.length}
              className="inline-block animate-in duration-300 zoom-in-90 fade-in"
            >
              {producto.total ? formatCantidad(producto.total) : `${producto.lineas.length} lotes`}
            </span>
            {detalle ? ` · ${detalle}` : ""}
            {principal.quedaPoco ? " · queda poco" : ""}
          </p>
          {!varias && (
            <div className="flex flex-wrap gap-1.5">
              <Caducidad linea={principal} />
              <Abierto linea={principal} />
            </div>
          )}
        </div>
        {!varias && (
          <>
            <BotonGastar linea={principal} onGastarUno={onGastarUno} onGastar={acciones.onGastar} />
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
                <div className="flex flex-wrap gap-1.5">
                  {l.caducaEl === null && l.abierto === null ? (
                    <span className="text-xs text-muted-foreground">Sin fecha</span>
                  ) : (
                    <Caducidad linea={l} />
                  )}
                  <Abierto linea={l} />
                </div>
              </div>
              <BotonGastar
                linea={l}
                onGastarUno={onGastarUno}
                onGastar={acciones.onGastar}
                variant="outline"
              />
              <MenuLinea linea={l} {...acciones} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
