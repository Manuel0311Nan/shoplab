"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { normalizarNombre } from "@/shared/kernel/texto";
import { CampoProducto } from "./autocompletar/campo-producto";

export interface ProductoAEditar {
  readonly nombre: string;
  readonly productoBaseId: string | null;
}

export interface NombreEditado extends ProductoAEditar {
  /** true: renombrar en todo el hogar (listas, despensa y Mis productos). */
  readonly todoElHogar: boolean;
}

type Props = {
  producto: ProductoAEditar | null;
  /** Dónde se aplica «solo aquí»: «Solo en esta lista», «Solo en esta línea»… */
  soloAqui: string;
  onGuardar: (cambio: NombreEditado) => void;
  onCerrar: () => void;
};

const campo = "h-11 rounded-lg border-transparent bg-muted md:text-base";

/**
 * Corregir el nombre de un producto o vincularlo a uno de la lista base (eligiéndolo en
 * el autocompletado). Se puede aplicar solo aquí o en todo el hogar para estandarizar.
 */
export function EditarNombreDialog({ producto, soloAqui, onGuardar, onCerrar }: Props) {
  return (
    <Dialog open={producto !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent>
        {producto && (
          <Formulario
            key={producto.nombre}
            producto={producto}
            soloAqui={soloAqui}
            onGuardar={onGuardar}
            onCerrar={onCerrar}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  producto,
  soloAqui,
  onGuardar,
  onCerrar,
}: Required<Omit<Props, "producto">> & { producto: ProductoAEditar }) {
  const { register, handleSubmit, setValue } = useForm<{ nombre: string }>({
    defaultValues: { nombre: producto.nombre },
  });
  const [productoBaseId, setProductoBaseId] = useState(producto.productoBaseId);
  // Lo escrito a mano suele querer estandarizarse en todo el hogar.
  const [todoElHogar, setTodoElHogar] = useState(producto.productoBaseId === null);
  const [error, setError] = useState<string | null>(null);
  const nombre = register("nombre");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((v) => {
        const limpio = v.nombre.trim().replace(/\s+/g, " ");
        if (limpio === "" || limpio.length > 80) {
          setError("El nombre debe tener entre 1 y 80 caracteres");
          return;
        }
        const igual =
          normalizarNombre(limpio) === normalizarNombre(producto.nombre) &&
          limpio === producto.nombre &&
          productoBaseId === producto.productoBaseId;
        if (igual) onCerrar();
        else onGuardar({ nombre: limpio, productoBaseId, todoElHogar });
      })}
    >
      <DialogTitle>Editar producto</DialogTitle>
      <DialogDescription>
        Corrige el nombre o elige una de las sugerencias para unirlo a ese producto.
      </DialogDescription>
      <CampoProducto
        id="editar-nombre-producto"
        campo={nombre}
        invalido={error !== null}
        className={campo}
        placeholder="Nombre del producto…"
        onElegir={(s) => {
          setValue("nombre", s.nombre);
          setProductoBaseId(s.productoBaseId);
          setError(null);
        }}
        onEscribir={() => {
          setProductoBaseId(null);
          setError(null);
        }}
      />
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">¿Dónde se cambia?</legend>
        <label className="flex min-h-11 items-center gap-3 rounded-lg bg-muted px-3 text-sm">
          <input
            type="radio"
            name="alcance"
            checked={!todoElHogar}
            onChange={() => setTodoElHogar(false)}
            className="size-4 accent-primary"
          />
          {soloAqui}
        </label>
        <label className="flex min-h-11 items-center gap-3 rounded-lg bg-muted px-3 py-2 text-sm">
          <input
            type="radio"
            name="alcance"
            checked={todoElHogar}
            onChange={() => setTodoElHogar(true)}
            className="size-4 accent-primary"
          />
          <span>
            En todo el hogar
            <span className="block text-xs text-muted-foreground">
              Todas las listas, la despensa y Mis productos
            </span>
          </span>
        </label>
      </fieldset>
      <Button type="submit" className="h-11 font-semibold">
        Guardar
      </Button>
      <DialogClose render={<Button variant="ghost" className="h-11 font-semibold" />}>
        Cancelar
      </DialogClose>
    </form>
  );
}
