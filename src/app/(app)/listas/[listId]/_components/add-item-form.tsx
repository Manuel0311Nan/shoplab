"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import type { PacksRecordados } from "@/contracts/memoria";
import { addItemRequestSchema } from "@/contracts/shopping";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { CampoProducto } from "../../../_components/autocompletar/campo-producto";
import {
  aCantidadDeLista,
  ETIQUETA_UNIDAD,
  POR_PACK_INICIAL,
  propuestaDeUnidad,
  UNIDADES_ELEGIBLES,
  type UnidadElegida,
} from "../../../_components/cantidad-pack";

const formSchema = addItemRequestSchema.pick({
  nombre: true,
  cantidad: true,
  nota: true,
  productoBaseId: true,
  categoria: true,
  unidadesPorPack: true,
});
export type NewItemValues = z.output<typeof formSchema>;

/** Id del campo de nombre: el FAB de la pantalla lo enfoca. */
export const NUEVO_PRODUCTO_ID = "nuevo-producto";

const campo = "h-11 rounded-lg border-transparent bg-muted md:text-base";

type Props = {
  onAdd: (values: NewItemValues) => void;
  /** Memoria del hogar: al elegir un producto que se compra por packs, se propone el pack. */
  packs?: PacksRecordados;
};

/**
 * Formulario de alta con autocompletado sobre la lista base y la memoria del hogar.
 * Elegir una sugerencia rellena nombre, unidad, categoría y vínculo; si luego se edita
 * el nombre, eso se olvida y lo decide el servidor al guardar.
 */
export function AddItemForm({ onAdd, packs = {} }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<z.input<typeof formSchema>, unknown, NewItemValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nombre: "", cantidad: { valor: 1, unidad: "unidad" }, productoBaseId: null },
  });

  const nombre = register("nombre");
  // «pack» no es una unidad del dominio: se guarda en unidades + unidadesPorPack.
  const [unidad, setUnidad] = useState<UnidadElegida>("unidad");
  const [porPack, setPorPack] = useState(String(POR_PACK_INICIAL));
  const [errorPack, setErrorPack] = useState<string | null>(null);

  function elegirUnidad(nueva: UnidadElegida) {
    setUnidad(nueva);
    setValue("cantidad.unidad", nueva === "pack" ? "unidad" : nueva);
  }

  function onSubmit(values: NewItemValues) {
    const cantidad = aCantidadDeLista(values.cantidad.valor, unidad, porPack);
    if (!cantidad.ok) {
      setErrorPack(cantidad.mensaje);
      return;
    }
    onAdd({ ...values, cantidad: cantidad.cantidad, unidadesPorPack: cantidad.unidadesPorPack });
    setErrorPack(null);
    reset();
    setUnidad("unidad");
    setPorPack(String(POR_PACK_INICIAL));
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-label="Añadir producto"
      className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-card"
    >
      <CampoProducto
        id={NUEVO_PRODUCTO_ID}
        campo={nombre}
        invalido={errors.nombre !== undefined}
        className={campo}
        onElegir={(sugerencia) => {
          setValue("nombre", sugerencia.nombre, { shouldValidate: true });
          const propuesta = propuestaDeUnidad(packs, sugerencia.nombre, sugerencia.unidad);
          elegirUnidad(propuesta.unidad);
          setPorPack(propuesta.porPack);
          setValue("productoBaseId", sugerencia.productoBaseId);
          setValue("categoria", sugerencia.categoria);
        }}
        onEscribir={() => {
          setValue("productoBaseId", null);
          setValue("categoria", undefined);
        }}
      />
      <div className="flex gap-2">
        <Input
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          aria-label="Cantidad"
          aria-invalid={errors.cantidad?.valor !== undefined}
          className={`${campo} w-20`}
          {...register("cantidad.valor", { valueAsNumber: true })}
        />
        <select
          aria-label="Unidad"
          value={unidad}
          onChange={(e) => elegirUnidad(e.target.value as UnidadElegida)}
          className="h-11 rounded-lg bg-muted px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {UNIDADES_ELEGIBLES.map((u) => (
            <option key={u} value={u}>
              {ETIQUETA_UNIDAD[u]}
            </option>
          ))}
        </select>
        <Button type="submit" className="h-11 flex-1 px-4 text-sm font-semibold">
          Añadir +
        </Button>
      </div>
      {unidad === "pack" && (
        <label className="flex items-center gap-2 text-sm font-semibold">
          de
          <Input
            type="number"
            inputMode="numeric"
            min="2"
            max="100"
            step="1"
            value={porPack}
            onChange={(e) => setPorPack(e.target.value)}
            aria-label="Unidades por pack"
            className={`${campo} w-20`}
          />
          ud. por pack
        </label>
      )}
      {errorPack && <p className="text-sm font-medium text-destructive">{errorPack}</p>}
      {errors.nombre && (
        <p className="text-sm font-medium text-destructive">{errors.nombre.message}</p>
      )}
      {errors.cantidad?.valor && (
        <p className="text-sm font-medium text-destructive">{errors.cantidad.valor.message}</p>
      )}
    </form>
  );
}
