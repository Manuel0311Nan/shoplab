"use client";
import type { LineaDespensaResponse } from "@/contracts/pantry";
import { Button } from "@/shared/ui/button";
import { usePulsacionLarga } from "../../_components/pulsacion-larga";

type Props = {
  linea: LineaDespensaResponse;
  onGastarUno: (linea: LineaDespensaResponse) => void;
  onGastar: (linea: LineaDespensaResponse) => void;
  variant?: "default" | "outline";
};

/**
 * En unidades, «−1»: un toque gasta 1 ud. (con «Deshacer» después). Una pulsación larga
 * abre el diálogo (varias, tirar). En g, kg, ml o l, «Gastar» abre el diálogo directamente.
 */
export function BotonGastar({ linea, onGastarUno, onGastar, variant = "default" }: Props) {
  const { manejadores: pulsacion } = usePulsacionLarga({
    onCorta: () => onGastarUno(linea),
    onLarga: () => onGastar(linea),
  });

  if (linea.cantidad.unidad !== "unidad") {
    return (
      <Button variant={variant} onClick={() => onGastar(linea)} className="h-11 px-4 font-semibold">
        Gastar
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      {...pulsacion}
      className="h-11 min-w-16 px-4 text-base font-bold tabular-nums select-none"
    >
      −1
      <span className="sr-only">
        : gastar 1 ud. de {linea.nombre}. Mantén pulsado para gastar varias o tirar
      </span>
    </Button>
  );
}
