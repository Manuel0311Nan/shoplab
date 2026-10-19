"use client";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";

export type OrdenLista = "categoria" | "anadido";

const CLAVE = "migas.orden-lista";

/**
 * Orden de "Por comprar", recordado en este dispositivo. Empieza por categoría (el
 * recorrido del súper); el guardado puede no estar disponible (modo privado): entonces
 * simplemente no se recuerda.
 */
export function useOrdenLista(): [OrdenLista, (orden: OrdenLista) => void] {
  const [orden, setOrden] = useState<OrdenLista>("categoria");

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado === "categoria" || guardado === "anadido") setOrden(guardado);
    } catch {
      // Sin almacenamiento: se queda el orden por defecto.
    }
  }, []);

  function cambiar(nuevo: OrdenLista) {
    setOrden(nuevo);
    try {
      localStorage.setItem(CLAVE, nuevo);
    } catch {
      // Sin almacenamiento: vale para esta visita.
    }
  }

  return [orden, cambiar];
}

const OPCIONES: readonly { valor: OrdenLista; nombre: string }[] = [
  { valor: "categoria", nombre: "Por categoría" },
  { valor: "anadido", nombre: "Por orden de añadido" },
];

export function SelectorOrden({
  orden,
  onCambiar,
}: {
  orden: OrdenLista;
  onCambiar: (orden: OrdenLista) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Ordenar la lista"
      className="flex gap-1 rounded-xl bg-muted p-1"
    >
      {OPCIONES.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={orden === o.valor}
          onClick={() => onCambiar(o.valor)}
          className={cn(
            "h-11 flex-1 rounded-lg px-2 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            orden === o.valor ? "bg-card shadow-card" : "text-muted-foreground",
          )}
        >
          {o.nombre}
        </button>
      ))}
    </div>
  );
}
