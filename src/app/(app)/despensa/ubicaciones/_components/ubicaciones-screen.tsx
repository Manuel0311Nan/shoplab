"use client";
import { ArrowDown, ArrowUp, ChevronLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  actualizarUbicacionAction,
  borrarUbicacionAction,
  crearUbicacionAction,
} from "@/app/actions/pantry";
import type { TipoUbicacionDto, UbicacionResponse } from "@/contracts/pantry";
import type { Result } from "@/shared/kernel/result";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";

type UbicacionConProductos = UbicacionResponse & { readonly productos: number };

const TIPOS: readonly { valor: TipoUbicacionDto; nombre: string }[] = [
  { valor: "frio", nombre: "Frío" },
  { valor: "congelado", nombre: "Congelado" },
  { valor: "ambiente", nombre: "Ambiente" },
];

const selectTipo =
  "h-11 rounded-lg bg-muted px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
const icono =
  "flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-30";

/**
 * D3: las ubicaciones del hogar. El tipo sirve para proponer dónde va cada cosa (lo
 * congelado al congelador aunque se llame "Arcón"). Ordenar con flechas: arrastrar no es
 * cómodo en el móvil.
 */
export function UbicacionesScreen({
  ubicaciones,
}: {
  ubicaciones: readonly UbicacionConProductos[];
}) {
  const [ocupado, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [aBorrar, setABorrar] = useState<UbicacionConProductos | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoUbicacionDto>("ambiente");

  function hacer(llamada: () => Promise<Result<unknown>>, despues?: () => void) {
    setError(null);
    startTransition(async () => {
      const r = await llamada();
      if (!r.ok) setError(r.error.message);
      else despues?.();
    });
  }

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-5 px-5 pt-2 pb-10">
      <header className="flex flex-col gap-2">
        <Link
          href="/despensa"
          className="-ml-2 flex h-11 items-center gap-1 self-start rounded-lg px-2 font-semibold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
          Despensa
        </Link>
        <h1 className="text-[28px] leading-9 font-bold">Ubicaciones</h1>
        <p className="text-muted-foreground">
          El tipo sirve para proponer dónde guardar cada cosa al añadirla.
        </p>
      </header>

      {error !== null && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
        >
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-2" aria-busy={ocupado}>
        {ubicaciones.map((u, i) => (
          <li key={u.id} className="flex flex-col gap-2 rounded-xl bg-card p-3 shadow-card">
            <div className="flex items-center gap-1">
              <Input
                defaultValue={u.nombre}
                maxLength={30}
                aria-label={`Nombre de ${u.nombre}`}
                onBlur={(e) => {
                  const nuevo = e.target.value.trim();
                  if (nuevo !== "" && nuevo !== u.nombre) {
                    hacer(() => actualizarUbicacionAction(u.id, { nombre: nuevo }));
                  }
                }}
                className="h-11 min-w-0 flex-1 rounded-lg border-transparent bg-muted md:text-base"
              />
              <button
                type="button"
                aria-label={`Subir ${u.nombre}`}
                disabled={i === 0 || ocupado}
                onClick={() =>
                  hacer(() => actualizarUbicacionAction(u.id, { posicion: u.orden - 1 }))
                }
                className={icono}
              >
                <ArrowUp className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Bajar ${u.nombre}`}
                disabled={i === ubicaciones.length - 1 || ocupado}
                onClick={() =>
                  hacer(() => actualizarUbicacionAction(u.id, { posicion: u.orden + 1 }))
                }
                className={icono}
              >
                <ArrowDown className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Borrar ${u.nombre}`}
                disabled={ubicaciones.length === 1 || ocupado}
                onClick={() =>
                  u.productos > 0 ? setABorrar(u) : hacer(() => borrarUbicacionAction(u.id))
                }
                className={`${icono} text-destructive`}
              >
                <Trash2 className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                {u.productos === 0
                  ? "Vacía"
                  : u.productos === 1
                    ? "1 producto"
                    : `${u.productos} productos`}
              </span>
              <select
                aria-label={`Tipo de ${u.nombre}`}
                value={u.tipo}
                onChange={(e) =>
                  hacer(() => actualizarUbicacionAction(u.id, { tipo: e.target.value }))
                }
                className={selectTipo}
              >
                {TIPOS.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
      </ul>

      <form
        aria-label="Nueva ubicación"
        className="flex flex-col gap-2 rounded-xl bg-card p-4 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (nombre.trim() === "") return;
          hacer(
            () => crearUbicacionAction({ nombre, tipo }),
            () => setNombre(""),
          );
        }}
      >
        <div className="flex gap-2">
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={30}
            placeholder="Nueva ubicación…"
            aria-label="Nombre de la nueva ubicación"
            className="h-11 min-w-0 flex-1 rounded-lg border-transparent bg-muted md:text-base"
          />
          <select
            aria-label="Tipo de la nueva ubicación"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoUbicacionDto)}
            className={selectTipo}
          >
            {TIPOS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="submit"
          disabled={nombre.trim() === "" || ocupado}
          className="h-11 font-semibold"
        >
          Añadir ubicación
        </Button>
      </form>

      <Dialog open={aBorrar !== null} onOpenChange={(a) => !a && setABorrar(null)}>
        <DialogContent>
          <DialogTitle>¿A dónde muevo lo que hay en {aBorrar?.nombre}?</DialogTitle>
          <DialogDescription>
            Tiene {aBorrar?.productos === 1 ? "1 producto" : `${aBorrar?.productos} productos`}.
            Elige otra ubicación y después se borra.
          </DialogDescription>
          <ul className="flex flex-col gap-2">
            {ubicaciones
              .filter((u) => u.id !== aBorrar?.id)
              .map((u) => (
                <li key={u.id}>
                  <Button
                    variant="outline"
                    className="h-11 w-full justify-start px-4 text-base"
                    onClick={() => {
                      const origen = aBorrar;
                      setABorrar(null);
                      if (origen) hacer(() => borrarUbicacionAction(origen.id, u.id));
                    }}
                  >
                    {u.nombre}
                  </Button>
                </li>
              ))}
          </ul>
          <DialogClose render={<Button variant="ghost" className="h-11 font-semibold" />}>
            Cancelar
          </DialogClose>
        </DialogContent>
      </Dialog>
    </section>
  );
}
