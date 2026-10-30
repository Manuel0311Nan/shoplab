"use client";
import { useRef, useState } from "react";

/** Lo que tarda una pulsación en contar como larga. */
export const PULSACION_LARGA_MS = 500;
/** Si el dedo se mueve más que esto, es scroll: ni toque ni pulsación larga. */
const MOVIMIENTO_MAXIMO_PX = 10;

/**
 * Toque corto y pulsación larga en el mismo botón. Devuelve los manejadores para
 * repartir sobre el elemento y `pulsando` (para enseñar que mantener hace algo). Si el
 * dedo se desplaza (scroll), no se activa nada.
 */
export function usePulsacionLarga({
  onCorta,
  onLarga,
}: {
  onCorta: () => void;
  onLarga: () => void;
}) {
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const anulada = useRef(false);
  // Mientras se mantiene: la pantalla lo enseña (una barra que se llena).
  const [pulsando, setPulsando] = useState(false);

  const cancelar = () => {
    if (temporizador.current !== null) clearTimeout(temporizador.current);
    temporizador.current = null;
    setPulsando(false);
  };

  const manejadores = {
    onPointerDown: (e: React.PointerEvent) => {
      anulada.current = false;
      inicio.current = { x: e.clientX, y: e.clientY };
      cancelar();
      setPulsando(true);
      temporizador.current = setTimeout(() => {
        anulada.current = true;
        setPulsando(false);
        onLarga();
      }, PULSACION_LARGA_MS);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (inicio.current === null) return;
      const dx = e.clientX - inicio.current.x;
      const dy = e.clientY - inicio.current.y;
      if (Math.hypot(dx, dy) > MOVIMIENTO_MAXIMO_PX) {
        anulada.current = true;
        cancelar();
      }
    },
    onPointerUp: cancelar,
    onPointerLeave: cancelar,
    onPointerCancel: () => {
      anulada.current = true;
      cancelar();
    },
    // En el móvil, la pulsación larga no debe abrir el menú del navegador.
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onClick: () => {
      if (anulada.current) {
        anulada.current = false;
        return;
      }
      onCorta();
    },
  };
  return { manejadores, pulsando };
}
