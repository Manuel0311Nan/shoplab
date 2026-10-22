"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { UbicacionesRecordadas } from "@/contracts/memoria";
import type { AddStockRequest, UbicacionResponse } from "@/contracts/pantry";
import { addStockRequestSchema } from "@/contracts/pantry";
import { unidadSchema } from "@/contracts/shopping";
import { ubicacionParaProducto } from "@/domains/pantry/domain/ubicacion";
import { tipoDeUbicacion } from "@/shared/kernel/categoria";
import { normalizarNombre } from "@/shared/kernel/texto";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { CampoProducto } from "../../_components/autocompletar/campo-producto";
import { CaducidadRapida } from "../../_components/caducidad-rapida";
import { selectClase } from "./editar-linea-dialog";

const formSchema = addStockRequestSchema.omit({ id: true }).extend({ ubicacionId: z.uuid() });
type Valores = z.output<typeof formSchema>;

type Props = {
  abierto: boolean;
  ubicaciones: readonly UbicacionResponse[];
  /** La del chip elegido, si hay uno: lo nuevo va ahí. */
  ubicacionInicial: string | null;
  /** Memoria del hogar: dónde se guardó cada producto la última vez. */
  recordadas?: UbicacionesRecordadas;
  hoy: string;
  onAnadir: (valores: AddStockRequest) => void;
  onCerrar: () => void;
};

const campo = "h-11 rounded-lg border-transparent bg-muted md:text-base";

/**
 * Botón +: añadir a mano, con autocompletado. La ubicación propuesta es donde se guardó
 * ese producto la última vez o, si no, la de su categoría.
 */
export function NuevoProductoDialog({
  abierto,
  ubicaciones,
  ubicacionInicial,
  recordadas = {},
  hoy,
  onAnadir,
  onCerrar,
}: Props) {
  const primera = ubicacionInicial ?? ubicaciones.at(0)?.id ?? "";
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof formSchema>, unknown, Valores>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      cantidad: { valor: 1, unidad: "unidad" },
      ubicacionId: primera,
      caducaEl: null,
    },
  });
  const [conFecha, setConFecha] = useState(false);
  const caducaEl = watch("caducaEl") ?? null;
  const nombre = register("nombre");

  function cerrar() {
    reset({
      nombre: "",
      cantidad: { valor: 1, unidad: "unidad" },
      ubicacionId: primera,
      caducaEl: null,
    });
    setConFecha(false);
    onCerrar();
  }

  return (
    <Dialog open={abierto} onOpenChange={(a) => !a && cerrar()}>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((v) => {
            onAnadir(v);
            cerrar();
          })}
        >
          <DialogTitle>Añadir a la despensa</DialogTitle>
          <CampoProducto
            id="nuevo-en-despensa"
            campo={nombre}
            invalido={errors.nombre !== undefined}
            className={campo}
            placeholder="Producto…"
            onElegir={(s) => {
              setValue("nombre", s.nombre, { shouldValidate: true });
              setValue("cantidad.unidad", s.unidad);
              setValue("productoBaseId", s.productoBaseId);
              setValue("categoria", s.categoria);
              if (ubicacionInicial === null) {
                const propuesta = ubicacionParaProducto(
                  ubicaciones,
                  recordadas[normalizarNombre(s.nombre)],
                  tipoDeUbicacion(s.categoria),
                );
                if (propuesta) setValue("ubicacionId", propuesta.id);
              }
            }}
            onEscribir={() => {
              setValue("productoBaseId", null);
              setValue("categoria", undefined);
            }}
          />
          {errors.nombre && (
            <p className="text-sm font-medium text-destructive">{errors.nombre.message}</p>
          )}
          <div className="flex gap-2">
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              aria-label="Cantidad"
              aria-invalid={errors.cantidad?.valor !== undefined}
              className={`${campo} w-24`}
              {...register("cantidad.valor", { valueAsNumber: true })}
            />
            <select
              aria-label="Unidad"
              className="h-11 rounded-lg bg-muted px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              {...register("cantidad.unidad")}
            >
              {unidadSchema.options.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Ubicación
            <select className={selectClase} {...register("ubicacionId")}>
              {ubicaciones.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </label>
          {conFecha ? (
            <CaducidadRapida
              valor={caducaEl}
              onCambiar={(v) => setValue("caducaEl", v)}
              hoy={hoy}
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setConFecha(true)}
              className="h-11 font-semibold"
            >
              Añadir caducidad
            </Button>
          )}
          <Button type="submit" className="h-11 font-semibold">
            Añadir
          </Button>
          <DialogClose
            render={<Button type="button" variant="ghost" className="h-11 font-semibold" />}
          >
            Cancelar
          </DialogClose>
        </form>
      </DialogContent>
    </Dialog>
  );
}
