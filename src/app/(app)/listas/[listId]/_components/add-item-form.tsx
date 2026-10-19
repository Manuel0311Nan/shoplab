"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { addItemRequestSchema, unidadSchema } from "@/contracts/shopping";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { CampoProducto } from "../../../_components/autocompletar/campo-producto";

const formSchema = addItemRequestSchema.pick({
  nombre: true,
  cantidad: true,
  nota: true,
  productoBaseId: true,
  categoria: true,
});
export type NewItemValues = z.output<typeof formSchema>;

/** Id del campo de nombre: el FAB de la pantalla lo enfoca. */
export const NUEVO_PRODUCTO_ID = "nuevo-producto";

const campo = "h-11 rounded-lg border-transparent bg-muted md:text-base";

type Props = { onAdd: (values: NewItemValues) => void };

/**
 * Formulario de alta con autocompletado sobre la lista base y la memoria del hogar.
 * Elegir una sugerencia rellena nombre, unidad, categoría y vínculo; si luego se edita
 * el nombre, eso se olvida y lo decide el servidor al guardar.
 */
export function AddItemForm({ onAdd }: Props) {
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

  function onSubmit(values: NewItemValues) {
    onAdd(values);
    reset();
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
          setValue("cantidad.unidad", sugerencia.unidad);
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
          className="h-11 rounded-lg bg-muted px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          {...register("cantidad.unidad")}
        >
          {unidadSchema.options.map((unidad) => (
            <option key={unidad} value={unidad}>
              {unidad}
            </option>
          ))}
        </select>
        <Button type="submit" className="h-11 flex-1 px-4 text-sm font-semibold">
          Añadir +
        </Button>
      </div>
      {errors.nombre && (
        <p className="text-sm font-medium text-destructive">{errors.nombre.message}</p>
      )}
      {errors.cantidad?.valor && (
        <p className="text-sm font-medium text-destructive">{errors.cantidad.valor.message}</p>
      )}
    </form>
  );
}
