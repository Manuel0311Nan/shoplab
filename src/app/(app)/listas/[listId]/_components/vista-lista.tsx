"use client";
import { LayoutGrid, List } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";

/** «detalle»: tarjetas con cantidad y categoría. «rapida»: cuadrícula para comprar deprisa. */
export type VistaLista = "detalle" | "rapida";

const CLAVE = "migas.vista-lista";

/**
 * La vista elegida, recordada en este dispositivo (como el orden). La despensa usa su
 * propia clave y empieza en la cuadrícula.
 */
export function useVistaLista(
  clave: string = CLAVE,
  porDefecto: VistaLista = "detalle",
): [VistaLista, (vista: VistaLista) => void] {
  const [vista, setVista] = useState<VistaLista>(porDefecto);

  useEffect(() => {
    try {
      const guardada = localStorage.getItem(clave);
      if (guardada === "detalle" || guardada === "rapida") setVista(guardada);
    } catch {
      // Sin almacenamiento: se queda la vista por defecto.
    }
  }, [clave]);

  function cambiar(nueva: VistaLista) {
    setVista(nueva);
    try {
      localStorage.setItem(clave, nueva);
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
  etiqueta = "Vista de la lista",
  compacto = false,
}: {
  vista: VistaLista;
  onCambiar: (vista: VistaLista) => void;
  etiqueta?: string;
  /** Solo iconos, para ponerlo junto al título y no ocupar una fila. */
  compacto?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      className={cn("flex gap-1 rounded-xl bg-muted p-1", compacto && "rounded-full")}
    >
      {OPCIONES.map(({ valor, nombre, Icono }) => (
        <button
          key={valor}
          type="button"
          role="radio"
          aria-checked={vista === valor}
          onClick={() => onCambiar(valor)}
          title={compacto ? nombre : undefined}
          className={cn(
            "flex items-center justify-center gap-1.5 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            compacto ? "size-10 rounded-full" : "h-11 flex-1 rounded-lg px-3",
            vista === valor ? "bg-card shadow-card" : "text-muted-foreground",
          )}
        >
          <Icono className={compacto ? "size-5" : "size-4"} aria-hidden="true" />
          {compacto ? <span className="sr-only">{nombre}</span> : nombre}
        </button>
      ))}
    </div>
  );
}
