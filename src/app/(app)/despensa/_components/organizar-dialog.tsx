"use client";
import { useState } from "react";
import type { LineaDespensaResponse, UbicacionResponse } from "@/contracts/pantry";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { formatCantidad } from "../../listas/[listId]/_components/format-cantidad";
import { selectClase } from "./editar-linea-dialog";

export interface Colocacion {
  readonly linea: LineaDespensaResponse;
  readonly ubicacionId: string;
}

type Props = {
  /** Lo que está por organizar; null = cerrado. */
  lineas: readonly LineaDespensaResponse[] | null;
  ubicaciones: readonly UbicacionResponse[];
  onGuardar: (colocaciones: Colocacion[]) => void;
  onCerrar: () => void;
};

/**
 * Colocar lo que se guardó al terminar la compra sin elegir sitio. Cada producto llega
 * con la ubicación propuesta; con «Guardar» queda organizado (aunque no se cambie).
 */
export function OrganizarDialog({ lineas, ubicaciones, onGuardar, onCerrar }: Props) {
  return (
    <Dialog open={lineas !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent>
        {lineas && (
          <Formulario
            key={lineas.map((l) => l.id).join("|")}
            lineas={lineas}
            ubicaciones={ubicaciones}
            onGuardar={onGuardar}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  lineas,
  ubicaciones,
  onGuardar,
}: Omit<Props, "lineas" | "onCerrar"> & { lineas: readonly LineaDespensaResponse[] }) {
  const [sitio, setSitio] = useState<Record<string, string>>(() =>
    Object.fromEntries(lineas.map((l) => [l.id, l.ubicacionId])),
  );

  return (
    <>
      <DialogTitle>Organizar la compra</DialogTitle>
      <DialogDescription>
        Elige dónde guardas cada cosa. Lo que ya está bien, déjalo como está.
      </DialogDescription>
      <ul className="flex flex-col divide-y">
        {lineas.map((l) => (
          <li key={l.id} className="flex items-center gap-3 py-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{l.nombre}</span>
              <span className="text-sm text-muted-foreground">{formatCantidad(l.cantidad)}</span>
            </span>
            <select
              aria-label={`Ubicación de ${l.nombre}`}
              value={sitio[l.id] ?? l.ubicacionId}
              onChange={(e) => setSitio((actual) => ({ ...actual, [l.id]: e.target.value }))}
              className={`${selectClase} w-auto max-w-[45%]`}
            >
              {ubicaciones.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
      <Button
        onClick={() =>
          onGuardar(lineas.map((l) => ({ linea: l, ubicacionId: sitio[l.id] ?? l.ubicacionId })))
        }
        className="h-11 font-semibold"
      >
        {lineas.length === 1 ? "Guardar en su sitio" : `Guardar los ${lineas.length} en su sitio`}
      </Button>
      <DialogClose render={<Button variant="ghost" className="h-11 font-semibold" />}>
        Más tarde
      </DialogClose>
    </>
  );
}
