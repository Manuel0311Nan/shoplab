"use client";
import { X } from "lucide-react";
import { useEffect } from "react";

export interface AccionAviso {
  readonly etiqueta: string;
  readonly onClick: () => void;
}

export interface Aviso {
  /** Distinto en cada aviso: reinicia el temporizador aunque el texto se repita. */
  readonly id: string;
  readonly texto: string;
  readonly acciones?: readonly AccionAviso[];
}

type Props = {
  aviso: Aviso | null;
  onCerrar: () => void;
  /** Lo que se ve antes de irse solo. */
  duracionMs?: number;
};

/**
 * Aviso abajo, encima del botón + y de la barra: no interrumpe. Lleva acciones de un
 * toque («Deshacer», «Añadir a la lista») y se va solo a los pocos segundos.
 */
export function AvisoFlotante({ aviso, onCerrar, duracionMs = 6000 }: Props) {
  useEffect(() => {
    if (aviso === null) return;
    const t = setTimeout(onCerrar, duracionMs);
    return () => clearTimeout(t);
  }, [aviso, onCerrar, duracionMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(9.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 sm:bottom-6"
    >
      {aviso !== null && (
        <div
          key={aviso.id}
          className="pointer-events-auto flex w-full max-w-md animate-in items-center gap-1 rounded-xl bg-foreground py-1.5 pr-1.5 pl-4 text-background shadow-lg duration-200 fade-in slide-in-from-bottom-4"
        >
          <p className="min-w-0 flex-1 py-2 text-sm font-medium">{aviso.texto}</p>
          {aviso.acciones?.map((a) => (
            <button
              key={a.etiqueta}
              type="button"
              onClick={() => {
                onCerrar();
                a.onClick();
              }}
              className="h-11 shrink-0 rounded-lg px-3 text-sm font-bold text-secondary outline-none hover:bg-background/10 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {a.etiqueta}
            </button>
          ))}
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar aviso"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg outline-none hover:bg-background/10 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
