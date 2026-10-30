"use client";
import { useState } from "react";
import type { CategoriaDto } from "@/contracts/categoria";
import type { LineaDespensaResponse, UpdateStockRequest } from "@/contracts/pantry";
import { type UnidadDto, unidadSchema } from "@/contracts/shopping";
import { CATEGORIAS, NOMBRE_CATEGORIA } from "@/shared/kernel/categoria";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { CaducidadRapida } from "../../_components/caducidad-rapida";

type Props = {
  linea: LineaDespensaResponse | null;
  hoy: string;
  onGuardar: (linea: LineaDespensaResponse, cambios: UpdateStockRequest) => void;
  onCerrar: () => void;
};

export const selectClase =
  "h-11 w-full rounded-lg bg-muted px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

/** Poner la caducidad, cambiar la categoría o corregir la cantidad (mover va aparte). */
export function EditarLineaDialog({ linea, hoy, onGuardar, onCerrar }: Props) {
  return (
    <Dialog open={linea !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent>
        {linea && <Formulario key={linea.id} linea={linea} hoy={hoy} onGuardar={onGuardar} />}
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  linea,
  hoy,
  onGuardar,
}: Omit<Props, "linea" | "onCerrar"> & { linea: LineaDespensaResponse }) {
  const [categoria, setCategoria] = useState<CategoriaDto>(linea.categoria);
  const [caducaEl, setCaducaEl] = useState<string | null>(linea.caducaEl);
  const [valor, setValor] = useState(String(linea.cantidad.valor));
  const [unidad, setUnidad] = useState<UnidadDto>(linea.cantidad.unidad);

  const numero = Number(valor.replace(",", "."));
  const cantidadValida = Number.isFinite(numero) && numero > 0;
  const cambios: UpdateStockRequest = {
    ...(categoria !== linea.categoria ? { categoria } : {}),
    ...(caducaEl !== linea.caducaEl ? { caducaEl } : {}),
    ...(cantidadValida && (numero !== linea.cantidad.valor || unidad !== linea.cantidad.unidad)
      ? { cantidad: { valor: numero, unidad } }
      : {}),
  };
  const hayCambios = Object.keys(cambios).length > 0;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (hayCambios && cantidadValida) onGuardar(linea, cambios);
      }}
    >
      <DialogTitle>{linea.nombre}</DialogTitle>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Categoría
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as CategoriaDto)}
          className={selectClase}
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {NOMBRE_CATEGORIA[c]}
            </option>
          ))}
        </select>
      </label>
      <CaducidadRapida valor={caducaEl} onCambiar={setCaducaEl} hoy={hoy} />
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-semibold">Cantidad (corregir)</legend>
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            aria-label="Cantidad"
            aria-invalid={!cantidadValida}
            className="h-11 w-28 rounded-lg border-transparent bg-muted md:text-base"
          />
          <select
            aria-label="Unidad"
            value={unidad}
            onChange={(e) => setUnidad(e.target.value as UnidadDto)}
            className="h-11 rounded-lg bg-muted px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {unidadSchema.options.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </fieldset>
      <Button
        type="submit"
        disabled={!hayCambios || !cantidadValida}
        className="h-11 font-semibold"
      >
        Guardar
      </Button>
      <DialogClose render={<Button type="button" variant="ghost" className="h-11 font-semibold" />}>
        Cancelar
      </DialogClose>
    </form>
  );
}
