"use client";
import { useRef } from "react";
import type { LineaDespensaResponse } from "@/contracts/pantry";
import { Button } from "@/shared/ui/button";

type Props = {
  linea: LineaDespensaResponse;
  onGastarUno: (linea: LineaDespensaResponse) => void;
  onGastar: (linea: LineaDespensaResponse) => void;
  variant?: "default" | "outline";
};

/** Lo que tarda una pulsación larga en abrir el diálogo completo. */
const PULSACION_LARGA_MS = 500;

/**
 * En unidades, «−1»: un toque gasta 1 ud. (con «Deshacer» después). Una pulsación larga
 * abre el diálogo (varias, tirar). En g, kg, ml o l, «Gastar» abre el diálogo directamente.
 */
export function BotonGastar({ linea, onGastarUno, onGastar, variant = "default" }: Props) {
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fueLarga = useRef(false);
  const enUnidades = linea.cantidad.unidad === "unidad";

  if (!enUnidades) {
    return (
      <Button variant={variant} onClick={() => onGastar(linea)} className="h-11 px-4 font-semibold">
        Gastar
      </Button>
    );
  }

  const cancelar = () => {
    if (temporizador.current !== null) clearTimeout(temporizador.current);
    temporizador.current = null;
  };

  return (
    <Button
      variant={variant}
      onPointerDown={() => {
        fueLarga.current = false;
        cancelar();
        temporizador.current = setTimeout(() => {
          fueLarga.current = true;
          onGastar(linea);
        }, PULSACION_LARGA_MS);
      }}
      onPointerUp={cancelar}
      onPointerLeave={cancelar}
      onPointerCancel={cancelar}
      // En el móvil, la pulsación larga no debe abrir el menú del navegador.
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (fueLarga.current) {
          fueLarga.current = false;
          return;
        }
        onGastarUno(linea);
      }}
      className="h-11 min-w-16 px-4 text-base font-bold tabular-nums select-none"
    >
      −1
      <span className="sr-only">
        : gastar 1 ud. de {linea.nombre}. Mantén pulsado para gastar varias o tirar
      </span>
    </Button>
  );
}
