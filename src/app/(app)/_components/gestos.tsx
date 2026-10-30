"use client";
import { Hand, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";

/**
 * Barra que se llena mientras se mantiene pulsada una casilla: enseña que mantener
 * hace algo distinto de tocar. Va dentro de un elemento `relative` y `overflow-hidden`.
 */
export function BarraPulsacion({ pulsando, className }: { pulsando: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 h-1.5 origin-left bg-current opacity-40",
        // Mismo tiempo que PULSACION_LARGA_MS; al soltar vuelve al instante.
        pulsando ? "scale-x-100 transition-transform duration-500 ease-linear" : "scale-x-0",
        className,
      )}
    />
  );
}

/**
 * Pista de cómo se usa una cuadrícula («Toca para… · Mantén pulsado para…»). Se puede
 * cerrar y no vuelve a salir en este dispositivo.
 */
export function PistaGestos({
  clave,
  toque,
  mantener,
}: {
  /** Dónde se recuerda que se cerró (una por pantalla). */
  clave: string;
  toque: string;
  mantener: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(clave) !== "cerrada");
    } catch {
      setVisible(true);
    }
  }, [clave]);

  if (!visible) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl bg-secondary py-1 pr-1 pl-3 text-sm text-secondary-foreground">
      <Hand className="size-5 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 py-1.5">
        <strong className="font-semibold">Toca</strong> {toque} ·{" "}
        <strong className="font-semibold">mantén pulsado</strong> {mantener}
      </p>
      <button
        type="button"
        aria-label="Entendido, no volver a mostrar"
        onClick={() => {
          setVisible(false);
          try {
            localStorage.setItem(clave, "cerrada");
          } catch {
            // Sin almacenamiento: vuelve a salir la próxima vez.
          }
        }}
        className="flex size-11 shrink-0 items-center justify-center rounded-lg outline-none hover:bg-background/40 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
