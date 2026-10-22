"use client";
import { LayoutGrid, List } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";

/** «detalle»: tarjetas con cantidad y categoría. «rapida»: cuadrícula para comprar deprisa. */
export type VistaLista = "detalle" | "rapida";

const CLAVE = "migas.vista-lista";

/** La vista de la lista, recordada en este dispositivo (como el orden). */
export function useVistaLista(): [VistaLista, (vista: VistaLista) => void] {
  const [vista, setVista] = useState<VistaLista>("detalle");

  useEffect(() => {
    try {
      const guardada = localStorage.getItem(CLAVE);
      if (guardada === "detalle" || guardada === "rapida") setVista(guardada);
    } catch {
      // Sin almacenamiento: se queda la vista por defecto.
    }
  }, []);

  function cambiar(nueva: VistaLista) {
    setVista(nueva);
    try {
      localStorage.setItem(CLAVE, nueva);
    } catch {
      // Sin almacenamiento: vale para esta visita.
    }
  }

  return [vista, cambiar];
}

const OPCIONES = [
  { valor: "detalle", nombre: "Lista", Icono: List },
  { valor: "rapida", nombre: "Rápida", Icono: LayoutGrid },
] as const;

export function SelectorVista({
  vista,
  onCambiar,
}: {
  vista: VistaLista;
  onCambiar: (vista: VistaLista) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Vista de la lista"
      className="flex gap-1 rounded-xl bg-muted p-1"
    >
      {OPCIONES.map(({ valor, nombre, Icono }) => (
        <button
          key={valor}
          type="button"
          role="radio"
          aria-checked={vista === valor}
          onClick={() => onCambiar(valor)}
          className={cn(
            "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            vista === valor ? "bg-card shadow-card" : "text-muted-foreground",
          )}
        >
          <Icono className="size-4" aria-hidden="true" />
          {nombre}
        </button>
      ))}
    </div>
  );
}
