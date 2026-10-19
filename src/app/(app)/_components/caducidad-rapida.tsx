"use client";
import { Dia, sumarDias } from "@/shared/kernel/dia";
import { cn } from "@/shared/lib/utils";
import { formatDiaYMes } from "./fechas";

type Props = {
  /** AAAA-MM-DD o null (sin fecha). */
  valor: string | null;
  onCambiar: (valor: string | null) => void;
  /** Hoy en hora del hogar, tal como lo calculó el servidor. */
  hoy: string;
  etiqueta?: string;
};

const RAPIDAS = [
  { dias: 3, texto: "+3 días" },
  { dias: 7, texto: "+1 semana" },
  { dias: 30, texto: "+1 mes" },
] as const;

const chip =
  "h-11 rounded-full px-3 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Caducidad sin teclear (D2): botones rápidos o una fecha. La fecha se muestra en
 * palabras debajo para confirmar ("3 de noviembre").
 */
export function CaducidadRapida({ valor, onCambiar, hoy, etiqueta = "Caducidad" }: Props) {
  const base = Dia.create(hoy);
  const opciones = base.ok
    ? RAPIDAS.map((r) => ({ ...r, fecha: sumarDias(base.value, r.dias) }))
    : [];

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold">{etiqueta}</legend>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={valor === null}
          onClick={() => onCambiar(null)}
          className={cn(chip, valor === null ? "bg-primary text-primary-foreground" : "bg-muted")}
        >
          Sin fecha
        </button>
        {opciones.map((o) => (
          <button
            key={o.dias}
            type="button"
            aria-pressed={valor === o.fecha}
            onClick={() => onCambiar(o.fecha)}
            className={cn(
              chip,
              valor === o.fecha ? "bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            {o.texto}
          </button>
        ))}
        <input
          type="date"
          aria-label={`${etiqueta}: elegir fecha`}
          value={valor ?? ""}
          min={hoy}
          onChange={(e) => onCambiar(e.target.value === "" ? null : e.target.value)}
          className="h-11 rounded-full bg-muted px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      {valor !== null && (
        <p className="text-sm text-muted-foreground">
          Caduca el {formatDiaYMes(`${valor}T12:00:00Z`)}
        </p>
      )}
    </fieldset>
  );
}
