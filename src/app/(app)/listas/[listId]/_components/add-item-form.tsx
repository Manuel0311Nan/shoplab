"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import type { ProductoBaseResponse } from "@/contracts/catalog";
import { addItemRequestSchema, unidadSchema } from "@/contracts/shopping";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cargarCatalogo } from "./catalogo";
import { filtrarProductos, indexarProductos } from "./filtrar-productos";

const formSchema = addItemRequestSchema.pick({
  nombre: true,
  cantidad: true,
  nota: true,
  productoBaseId: true,
});
export type NewItemValues = z.output<typeof formSchema>;

/** Id del campo de nombre: el FAB de la pantalla lo enfoca. */
export const NUEVO_PRODUCTO_ID = "nuevo-producto";

const campo = "h-11 rounded-lg border-transparent bg-muted md:text-base";

type Props = { onAdd: (values: NewItemValues) => void };

/**
 * Formulario de alta con autocompletado sobre la lista base (D7). Elegir una sugerencia
 * rellena el nombre y la unidad y guarda el producto base; si luego se edita el nombre,
 * deja de estar vinculado. Escribir algo que no está en la lista base también vale.
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

  const listboxId = useId();
  const [catalogo, setCatalogo] = useState<readonly ProductoBaseResponse[]>([]);
  const indice = useMemo(() => indexarProductos(catalogo), [catalogo]);
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);
  const sugerencias = abierto ? filtrarProductos(indice, texto) : [];
  const mostrar = sugerencias.length > 0;

  const nombre = register("nombre", {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setTexto(e.target.value);
      setValue("productoBaseId", null);
      setAbierto(true);
      setActiva(-1);
    },
    onBlur: () => setAbierto(false),
  });

  function elegir(producto: ProductoBaseResponse) {
    setValue("nombre", producto.nombre, { shouldValidate: true });
    setValue("cantidad.unidad", producto.unidadPorDefecto);
    setValue("productoBaseId", producto.id);
    setTexto(producto.nombre);
    setAbierto(false);
    setActiva(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!mostrar) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const delta = e.key === "ArrowDown" ? 1 : -1;
      setActiva((i) => (i + delta + sugerencias.length) % sugerencias.length);
    } else if (e.key === "Enter" && activa >= 0) {
      const producto = sugerencias[activa];
      if (producto) {
        e.preventDefault();
        elegir(producto);
      }
    } else if (e.key === "Escape") {
      setAbierto(false);
    }
  }

  function onSubmit(values: NewItemValues) {
    onAdd(values);
    reset();
    setTexto("");
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-label="Añadir producto"
      className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-card"
    >
      <div className="relative">
        <Input
          id={NUEVO_PRODUCTO_ID}
          placeholder="Añadir producto…"
          aria-label="Producto"
          aria-invalid={errors.nombre !== undefined}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={mostrar}
          aria-controls={listboxId}
          aria-activedescendant={activa >= 0 ? `${listboxId}-${activa}` : undefined}
          className={campo}
          onFocus={() => {
            cargarCatalogo().then(setCatalogo, () => {});
          }}
          onKeyDown={onKeyDown}
          {...nombre}
        />
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Sugerencias"
          hidden={!mostrar}
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-xl bg-popover p-1 text-popover-foreground shadow-lg"
        >
          {sugerencias.map((producto, i) => (
            <li
              key={producto.id}
              id={`${listboxId}-${i}`}
              role="option"
              aria-selected={i === activa}
              // pointerdown + preventDefault: elige sin quitar el foco del campo (no salta onBlur).
              onPointerDown={(e) => {
                e.preventDefault();
                elegir(producto);
              }}
              className={cn(
                "flex min-h-11 cursor-default items-center justify-between gap-3 rounded-lg px-3 text-base",
                i === activa && "bg-muted",
              )}
            >
              <span className="truncate">{producto.nombre}</span>
              <span className="text-sm text-muted-foreground">{producto.unidadPorDefecto}</span>
            </li>
          ))}
        </ul>
      </div>
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
