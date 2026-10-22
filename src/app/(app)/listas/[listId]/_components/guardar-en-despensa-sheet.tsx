"use client";
import { useEffect, useState, useTransition } from "react";
import { guardarCompraAction, ubicacionesAction } from "@/app/actions/pantry";
import type { UbicacionesRecordadas } from "@/contracts/memoria";
import type { UbicacionResponse } from "@/contracts/pantry";
import type { ShoppingItemResponse } from "@/contracts/shopping";
import { ubicacionParaProducto } from "@/domains/pantry/domain/ubicacion";
import { tipoDeUbicacion } from "@/shared/kernel/categoria";
import { newId } from "@/shared/kernel/ids";
import { normalizarNombre } from "@/shared/kernel/texto";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { CaducidadRapida } from "../../../_components/caducidad-rapida";
import { formatCantidad } from "./format-cantidad";

type Props = {
  listaId: string;
  /** Lo que estaba en el carro al terminar; null = cerrada. */
  productos: readonly ShoppingItemResponse[] | null;
  onCerrar: (mensaje?: string) => void;
};

interface Fila {
  /** Id del movimiento de entrada: el mismo en cada reintento, así no se duplica. */
  readonly id: string;
  readonly item: ShoppingItemResponse;
  marcado: boolean;
  ubicacionId: string;
  caducaEl: string | null;
}

/** Donde se guardó la última vez o, si no, la de su categoría. */
function propuesta(
  ubicaciones: readonly UbicacionResponse[],
  recordadas: UbicacionesRecordadas,
  item: ShoppingItemResponse,
): string {
  return (
    ubicacionParaProducto(
      ubicaciones,
      recordadas[normalizarNombre(item.nombre)],
      tipoDeUbicacion(item.categoria),
    )?.id ?? ""
  );
}

/**
 * D6: al terminar la compra, lo comprado llega marcado, con la ubicación propuesta (la
 * última en la que se guardó o la de su categoría) y sin
 * fecha (D2). Una pulsación en "Guardar" basta; se puede desmarcar lo que no va a la
 * despensa o desplegar las caducidades.
 */
export function GuardarEnDespensaSheet({ listaId, productos, onCerrar }: Props) {
  const [datos, setDatos] = useState<{ hoy: string; ubicaciones: UbicacionResponse[] } | null>(
    null,
  );
  const [filas, setFilas] = useState<Fila[]>([]);
  const [conFechas, setConFechas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, startTransition] = useTransition();

  useEffect(() => {
    if (productos === null) return;
    setError(null);
    setConFechas(false);
    let vigente = true;
    void ubicacionesAction().then(
      (r) => {
        if (!vigente) return;
        if (!r.ok) {
          setError(r.error.message);
          return;
        }
        setDatos(r.value);
        setFilas(
          productos.map((item) => ({
            id: newId(),
            item,
            marcado: true,
            ubicacionId: propuesta(r.value.ubicaciones, r.value.recordadas, item),
            caducaEl: null,
          })),
        );
      },
      () => {
        if (vigente) setError("No se han podido cargar las ubicaciones");
      },
    );
    return () => {
      vigente = false;
    };
  }, [productos]);

  const cambiar = (id: string, cambio: Partial<Fila>) =>
    setFilas((actual) => actual.map((f) => (f.id === id ? { ...f, ...cambio } : f)));
  const marcadas = filas.filter((f) => f.marcado);

  function guardar() {
    setError(null);
    startTransition(async () => {
      const r = await guardarCompraAction({
        listaId,
        productos: marcadas.map((f) => ({
          id: f.id,
          nombre: f.item.nombre,
          productoBaseId: f.item.productoBaseId,
          categoria: f.item.categoria,
          ubicacionId: f.ubicacionId,
          cantidad: f.item.cantidad,
          caducaEl: f.caducaEl,
        })),
      });
      if (!r.ok) setError(r.error.message);
      else
        onCerrar(
          r.value.guardados === 1
            ? "1 producto guardado en la despensa."
            : `${r.value.guardados} productos guardados en la despensa.`,
        );
    });
  }

  return (
    <Dialog open={productos !== null} onOpenChange={(a) => !a && onCerrar()}>
      <DialogContent>
        <DialogTitle>¿Lo guardas en la despensa?</DialogTitle>
        <DialogDescription>
          Desmarca lo que no va a la despensa. La ubicación se puede cambiar.
        </DialogDescription>

        {datos === null && error === null && <p className="text-muted-foreground">Cargando…</p>}

        {datos !== null && (
          <ul className="flex flex-col divide-y">
            {filas.map((f) => (
              <li key={f.id} className="flex flex-col gap-2 py-2">
                <div className="flex items-center gap-3">
                  <label className="flex min-h-11 min-w-0 flex-1 items-center gap-3">
                    <Checkbox
                      checked={f.marcado}
                      onCheckedChange={(v) => cambiar(f.id, { marcado: v === true })}
                      className="size-5"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{f.item.nombre}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCantidad(f.item.cantidad)}
                      </span>
                    </span>
                  </label>
                  <select
                    aria-label={`Ubicación de ${f.item.nombre}`}
                    value={f.ubicacionId}
                    disabled={!f.marcado}
                    onChange={(e) => cambiar(f.id, { ubicacionId: e.target.value })}
                    className="h-11 max-w-[40%] rounded-lg bg-muted px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                  >
                    {datos.ubicaciones.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                {conFechas && f.marcado && (
                  <CaducidadRapida
                    valor={f.caducaEl}
                    onCambiar={(v) => cambiar(f.id, { caducaEl: v })}
                    hoy={datos.hoy}
                    etiqueta={`Caducidad de ${f.item.nombre}`}
                  />
                )}
              </li>
            ))}
          </ul>
        )}

        {error !== null && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}

        {datos !== null && !conFechas && (
          <Button
            variant="outline"
            onClick={() => setConFechas(true)}
            className="h-11 font-semibold"
          >
            Añadir caducidades
          </Button>
        )}
        <Button
          onClick={guardar}
          disabled={guardando || datos === null || marcadas.length === 0}
          className="h-11 font-semibold"
        >
          {guardando
            ? "Guardando…"
            : marcadas.length === 1
              ? "Guardar 1 producto"
              : `Guardar ${marcadas.length} productos`}
        </Button>
        <Button variant="ghost" onClick={() => onCerrar()} className="h-11 font-semibold">
          Ahora no
        </Button>
      </DialogContent>
    </Dialog>
  );
}
