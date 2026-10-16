"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { addItemRequestSchema, unidadSchema } from "@/contracts/shopping";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
const formSchema = addItemRequestSchema.omit({ id: true });
export type NewItemValues = z.output<typeof formSchema>;
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <Input
          placeholder="Añadir producto…"
          aria-label="Producto"
          aria-invalid={errors.nombre !== undefined}
          {...register("nombre")}
        />
        <Input
          type="number"
          step="any"
          min="0"
          className="w-20"
          aria-label="Cantidad"
          {...register("cantidad.valor", { valueAsNumber: true })}
        />
        <select
          aria-label="Unidad"
          className="rounded-md border px-2 text-sm"
          {...register("cantidad.unidad")}
        >
          {unidadSchema.options.map((unidad) => (
            <option key={unidad} value={unidad}>
              {unidad}
            </option>
          ))}
        </select>
        <Button type="submit">Añadir</Button>
      </div>
      {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
      {errors.cantidad?.valor && (
        <p className="text-sm text-destructive">{errors.cantidad.valor.message}</p>
      )}
    </form>
  );
}
