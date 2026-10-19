"use client";
import { useId, useMemo, useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { NOMBRE_CATEGORIA } from "@/shared/kernel/categoria";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";
import { cargarSugerencias } from "./catalogo";
import { filtrarSugerencias, indexarSugerencias } from "./filtrar-sugerencias";
import type { Sugerencia } from "./sugerencia";

type Props = {
  id: string;
  /** register("nombre") de React Hook Form. */
  campo: UseFormRegisterReturn;
  invalido: boolean;
  onElegir: (sugerencia: Sugerencia) => void;
  /** El usuario escribió: lo elegido antes deja de valer. */
  onEscribir: () => void;
  placeholder?: string;
  className?: string;
};

/**
 * Campo de producto con autocompletado accesible (combobox) sobre la lista base y lo
 * que el hogar ya escribió (D1 de la vista 3). Escribir algo que no está también vale:
 * el servidor lo vincula o lo clasifica al guardar.
 */
export function CampoProducto({
  id,
  campo,
  invalido,
  onElegir,
  onEscribir,
  placeholder = "Añadir producto…",
  className,
}: Props) {
  const listboxId = useId();
  const [opciones, setOpciones] = useState<readonly Sugerencia[]>([]);
  const indice = useMemo(() => indexarSugerencias(opciones), [opciones]);
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);
  const sugerencias = abierto ? filtrarSugerencias(indice, texto) : [];
  const mostrar = sugerencias.length > 0;

  function elegir(sugerencia: Sugerencia) {
    setTexto(sugerencia.nombre);
    setAbierto(false);
    setActiva(-1);
    onElegir(sugerencia);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!mostrar) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const delta = e.key === "ArrowDown" ? 1 : -1;
      setActiva((i) => (i + delta + sugerencias.length) % sugerencias.length);
    } else if (e.key === "Enter" && activa >= 0) {
      const sugerencia = sugerencias[activa];
      if (sugerencia) {
        e.preventDefault();
        elegir(sugerencia);
      }
    } else if (e.key === "Escape") {
      setAbierto(false);
    }
  }

  return (
    <div className="relative">
      <Input
        id={id}
        placeholder={placeholder}
        aria-label="Producto"
        aria-invalid={invalido}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={mostrar}
        aria-controls={listboxId}
        aria-activedescendant={activa >= 0 ? `${listboxId}-${activa}` : undefined}
        className={className}
        onFocus={() => {
          cargarSugerencias().then(setOpciones, () => {});
        }}
        onKeyDown={onKeyDown}
        {...campo}
        onChange={(e) => {
          void campo.onChange(e);
          setTexto(e.target.value);
          setAbierto(true);
          setActiva(-1);
          onEscribir();
        }}
        onBlur={(e) => {
          void campo.onBlur(e);
          setAbierto(false);
        }}
      />
      <ul
        id={listboxId}
        role="listbox"
        aria-label="Sugerencias"
        hidden={!mostrar}
        className="absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-xl bg-popover p-1 text-popover-foreground shadow-lg"
      >
        {sugerencias.map((sugerencia, i) => (
          <li
            key={sugerencia.clave}
            id={`${listboxId}-${i}`}
            role="option"
            aria-selected={i === activa}
            // pointerdown + preventDefault: elige sin quitar el foco del campo (no salta onBlur).
            onPointerDown={(e) => {
              e.preventDefault();
              elegir(sugerencia);
            }}
            className={cn(
              "flex min-h-11 cursor-default items-center justify-between gap-3 rounded-lg px-3 text-base",
              i === activa && "bg-muted",
            )}
          >
            <span className="min-w-0 truncate">{sugerencia.nombre}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {NOMBRE_CATEGORIA[sugerencia.categoria]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
