"use client";
import { useState } from "react";
import { esEmoji } from "@/shared/kernel/emoji";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { EMOJIS_SUGERIDOS } from "./emoji-producto";

type Props = {
  /** El que se ve ahora (elegido o por defecto); null: icono de la categoría. */
  actual: string | null;
  /** ¿Lo eligió el hogar? Entonces se puede volver al de por defecto. */
  elegido: boolean;
  /** null: volver al de por defecto. */
  onElegir: (emoji: string | null) => void;
};

/**
 * Elegir el emoji de un producto: una rejilla con los habituales y un campo para pegar o
 * escribir cualquier otro con el teclado de emojis del móvil.
 */
export function SelectorEmoji({ actual, elegido, onElegir }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [otro, setOtro] = useState("");
  const otroValido = esEmoji(otro);

  if (!abierto) {
    return (
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-lg bg-muted text-2xl">
          {actual ?? "—"}
        </span>
        <Button variant="outline" onClick={() => setAbierto(true)} className="h-11 font-semibold">
          Cambiar emoji
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="listbox"
        aria-label="Emojis"
        className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto rounded-lg bg-muted p-1"
      >
        {EMOJIS_SUGERIDOS.map((e) => (
          <button
            key={e}
            type="button"
            role="option"
            aria-selected={e === actual}
            onClick={() => {
              onElegir(e);
              setAbierto(false);
            }}
            className={cn(
              "flex aspect-square items-center justify-center rounded-md text-2xl outline-none hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/50",
              e === actual && "bg-card shadow-card",
            )}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={otro}
          onChange={(e) => setOtro(e.target.value)}
          placeholder="U otro: 🫚"
          aria-label="Otro emoji"
          className="h-11 flex-1 rounded-lg border-transparent bg-muted text-lg"
        />
        <Button
          variant="outline"
          disabled={!otroValido}
          onClick={() => {
            onElegir(otro.trim());
            setAbierto(false);
          }}
          className="h-11 font-semibold"
        >
          Usar
        </Button>
      </div>
      {elegido && (
        <Button
          variant="ghost"
          onClick={() => {
            onElegir(null);
            setAbierto(false);
          }}
          className="h-11 self-start font-semibold"
        >
          Volver al de por defecto
        </Button>
      )}
    </div>
  );
}
