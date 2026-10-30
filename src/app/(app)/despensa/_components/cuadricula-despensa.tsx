"use client";
import { useId } from "react";
import type { EmojisProductos } from "@/contracts/memoria";
import { cn } from "@/shared/lib/utils";
import { emojiDe } from "../../_components/emoji-producto";
import { BarraPulsacion, PistaGestos } from "../../_components/gestos";
import { IconoCategoria } from "../../_components/icono-categoria";
import { usePulsacionLarga } from "../../_components/pulsacion-larga";
import { formatCantidad } from "../../listas/[listId]/_components/format-cantidad";
import { type GrupoDespensa, type ProductoDespensa, estadoCasilla } from "./vista-despensa";

type Props = {
  grupos: readonly GrupoDespensa[];
  emojis: EmojisProductos;
  /** Toque: gastar 1 (o, en g/kg/ml/l, elegir cuánto). */
  onTocar: (producto: ProductoDespensa) => void;
  /** Mantener: abrir las acciones (gastar o tirar, abrir, mover, renombrar…). */
  onMantener: (producto: ProductoDespensa) => void;
};

const TONO = {
  rojo: "bg-destructive/10 text-destructive",
  ambar: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  neutro: "bg-muted text-muted-foreground",
} as const;

/**
 * La despensa como cuadrícula, por ubicación (o categoría): cada casilla es un producto
 * con su emoji, cuánto hay y, si hace falta, un aviso (caduca, abierto, queda poco).
 */
export function CuadriculaDespensa({ grupos, emojis, onTocar, onMantener }: Props) {
  const ayudaId = useId();
  return (
    <div className="flex flex-col gap-6">
      <p id={ayudaId} className="sr-only">
        Toca para gastar una unidad. Mantén pulsado para gastar varias, tirar, abrir, mover o
        cambiar el nombre.
      </p>
      <PistaGestos
        clave="migas.pista-despensa-rapida"
        toque="para gastar uno"
        mantener="para editar"
      />
      {grupos.map((g) => {
        const productos = g.subgrupos.flatMap((s) => s.productos);
        return (
          <section key={g.clave} aria-label={g.titulo} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{g.titulo}</h2>
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                {productos.length}
              </span>
            </div>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {productos.map((p) => (
                <Casilla
                  key={p.clave}
                  producto={p}
                  emoji={emojiDe(emojis, p.nombre)}
                  ayudaId={ayudaId}
                  onTocar={() => onTocar(p)}
                  onMantener={() => onMantener(p)}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Casilla({
  producto,
  emoji,
  ayudaId,
  onTocar,
  onMantener,
}: {
  producto: ProductoDespensa;
  emoji: string | null;
  ayudaId: string;
  onTocar: () => void;
  onMantener: () => void;
}) {
  const { manejadores, pulsando } = usePulsacionLarga({ onCorta: onTocar, onLarga: onMantener });
  const cantidad = producto.total
    ? formatCantidad(producto.total)
    : `${producto.lineas.length} lotes`;
  const estado = estadoCasilla(producto);
  const enUnidades = producto.principal.cantidad.unidad === "unidad";

  return (
    <li>
      <button
        type="button"
        {...manejadores}
        aria-describedby={ayudaId}
        className="relative flex size-full min-h-32 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl bg-card p-2 pt-5 text-center shadow-card outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 motion-safe:transition-transform"
      >
        <BarraPulsacion pulsando={pulsando} className="text-primary" />
        <span
          key={cantidad}
          className="absolute top-1.5 right-1.5 max-w-[calc(100%-0.75rem)] animate-in truncate rounded-full bg-muted px-1.5 py-0.5 text-xs font-bold tabular-nums duration-300 zoom-in-90"
        >
          {cantidad}
        </span>
        {emoji !== null ? (
          <span className="text-4xl leading-none" aria-hidden="true">
            {emoji}
          </span>
        ) : (
          <IconoCategoria categoria={producto.categoria} className="size-9 text-primary" />
        )}
        <span className="text-sm leading-tight font-semibold break-words hyphens-auto">
          {producto.nombre}
        </span>
        {estado !== null && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[11px] leading-tight font-semibold",
              TONO[estado.tono],
            )}
          >
            {estado.texto}
          </span>
        )}
        <span className="sr-only">
          , {cantidad}
          {estado !== null ? `, ${estado.texto}` : ""}
          {enUnidades ? ": toca para gastar una" : ": toca para elegir cuánto gastas"}
        </span>
      </button>
    </li>
  );
}
