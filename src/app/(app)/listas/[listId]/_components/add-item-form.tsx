"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { addItemRequestSchema, unidadSchema } from "@/contracts/shopping";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

const formSchema = addItemRequestSchema.omit({ id: true });
export type NewItemValues = z.output<typeof formSchema>;

/** Id del campo de nombre: el FAB de la pantalla lo enfoca. */
export const NUEVO_PRODUCTO_ID = "nuevo-producto";

const campo = "h-11 rounded-lg border-transparent bg-muted md:text-base";

type Props = { onAdd: (values: NewItemValues) => void };

export function AddItemForm({ onAdd }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof formSchema>, unknown, NewItemValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nombre: "", cantidad: { valor: 1, unidad: "unidad" } },
  });

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
      <Input
        id={NUEVO_PRODUCTO_ID}
        placeholder="Añadir producto…"
        aria-label="Producto"
        aria-invalid={errors.nombre !== undefined}
        autoComplete="off"
        className={campo}
        {...register("nombre")}
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
