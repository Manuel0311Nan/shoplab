"use client";
import { Check, ChevronLeft, Clock, Minus, Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { anadirFaltantesAction } from "@/app/actions/recipes";
import type { IngredienteRecetaResponse, RecetaDetalleResponse } from "@/contracts/recipes";
import { calcularIngrediente, limitarRaciones } from "@/domains/recipes/domain/disponibilidad";
import { RACIONES_MAX } from "@/domains/recipes/domain/receta";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { formatMedida, unirEnFrase } from "../../_components/textos";

type Props = {
  receta: RecetaDetalleResponse;
  /** Listas activas, para «Añadir lo que falta» (la primera es la última modificada). */
  listas: readonly { id: string; nombre: string }[];
};

/**
 * Detalle de una receta. Las raciones empiezan ajustadas a la despensa y se pueden
 * cambiar: lo que no llega pasa a «falta» y se puede mandar a la lista. El cálculo es
 * el mismo del dominio (`calcularIngrediente`), así que no hace falta ir al servidor.
 */
export function RecetaScreen({ receta, listas }: Props) {
  const [raciones, setRaciones] = useState(receta.racionesElegidas);
  const [listaId, setListaId] = useState<string | null>(null);
  const [ocupado, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null);

  const ingredientes = receta.ingredientes.map((i) => ({
    ...i,
    ...calcularIngrediente(i, receta.raciones, raciones),
  }));
  const faltan = ingredientes.filter(
    (i) => !i.basico && !i.opcional && (i.estado === "falta" || i.estado === "poco"),
  );
  const lista = listas.find((l) => l.id === listaId) ?? listas.at(0) ?? null;

  function cambiarRaciones(nuevas: number) {
    setRaciones(limitarRaciones(nuevas));
    setMensaje(null);
  }

  function anadirFaltantes() {
    if (lista === null) return;
    startTransition(async () => {
      const r = await anadirFaltantesAction({ recetaId: receta.id, raciones, listaId: lista.id });
      if (!r.ok) {
        setMensaje({ texto: r.error.message, error: true });
        return;
      }
      const { anadidos, yaEstaban, listaNombre } = r.value;
      const partes = [
        anadidos > 0 && `${anadidos} ${anadidos === 1 ? "producto añadido" : "productos añadidos"}`,
        yaEstaban > 0 && `${yaEstaban} ya ${yaEstaban === 1 ? "estaba" : "estaban"}`,
      ].filter((p): p is string => typeof p === "string");
      setMensaje({ texto: `${listaNombre}: ${partes.join(", ")}.`, error: false });
    });
  }

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-5 pt-4 pb-24 sm:pb-10">
      <Link
        href="/recetas"
        className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start text-sm font-semibold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Recetas
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-9 font-bold">{receta.nombre}</h1>
        <p className="text-muted-foreground">{receta.descripcion}</p>
        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4" aria-hidden="true" />
          {receta.minutos} min
        </p>
      </header>

      <section
        aria-label="Raciones"
        className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-card"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold">Raciones</span>
          <div className="flex items-center gap-1 rounded-full bg-muted p-1">
            <button
              type="button"
              aria-label="Una ración menos"
              disabled={raciones <= 1}
              onClick={() => cambiarRaciones(raciones - 1)}
              className="flex size-11 items-center justify-center rounded-full outline-none hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <output aria-live="polite" className="w-8 text-center text-lg font-bold">
              {raciones}
            </output>
            <button
              type="button"
              aria-label="Una ración más"
              disabled={raciones >= RACIONES_MAX}
              onClick={() => cambiarRaciones(raciones + 1)}
              className="flex size-11 items-center justify-center rounded-full outline-none hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <NotaRaciones receta={receta} raciones={raciones} onVolver={cambiarRaciones} />

        {faltan.length === 0 ? (
          <p className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground">
            <Check className="size-4 shrink-0" aria-hidden="true" />
            Tienes todo para {raciones} {raciones === 1 ? "ración" : "raciones"}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
              Para {raciones} {raciones === 1 ? "ración" : "raciones"} te falta:{" "}
              {unirEnFrase(faltan.map((i) => i.nombre.toLocaleLowerCase("es-ES")))}
            </p>
            {listas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tienes ninguna lista activa a la que añadirlo.
              </p>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                {listas.length > 1 && (
                  <label className="flex flex-1 flex-col gap-1 text-sm font-semibold">
                    Lista
                    <select
                      value={lista?.id ?? ""}
                      onChange={(e) => setListaId(e.target.value)}
                      className="h-11 rounded-lg bg-muted px-3 text-base font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {listas.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <Button onClick={anadirFaltantes} disabled={ocupado} className="h-11 font-semibold">
                  <ShoppingCart aria-hidden="true" />
                  {ocupado ? "Añadiendo…" : "Añadir lo que falta a la lista"}
                </Button>
              </div>
            )}
          </div>
        )}
        {mensaje !== null && (
          <p
            role={mensaje.error ? "alert" : "status"}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium",
              mensaje.error
                ? "bg-destructive/10 text-destructive"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {mensaje.texto}
          </p>
        )}
      </section>

      <section aria-labelledby="ingredientes" className="flex flex-col gap-3">
        <h2 id="ingredientes" className="text-xl font-bold">
          Ingredientes
        </h2>
        <ul className="flex flex-col divide-y divide-border rounded-xl bg-card px-4 shadow-card">
          {ingredientes.map((i) => (
            <FilaIngrediente
              key={i.nombre}
              ingrediente={i}
              // «1 mediana», «1 lata»: valen para las raciones de la receta, no escaladas.
              conNota={i.cantidad === null || raciones === receta.raciones}
            />
          ))}
        </ul>
      </section>

      <section aria-labelledby="pasos" className="flex flex-col gap-3">
        <h2 id="pasos" className="text-xl font-bold">
          Cómo se hace
        </h2>
        <ol className="flex flex-col gap-4">
          {receta.pasos.map((paso, n) => (
            <li key={paso} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-sm font-bold text-primary-foreground">
                {n + 1}
              </span>
              <p className="pt-1">{paso}</p>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}

function NotaRaciones({
  receta,
  raciones,
  onVolver,
}: Readonly<{ receta: RecetaDetalleResponse; raciones: number; onVolver: (r: number) => void }>) {
  const { racionesPosibles, racionesSugeridas } = receta;
  let texto: string | null = null;
  if (racionesPosibles !== null && raciones > racionesPosibles) {
    texto =
      racionesPosibles === 0
        ? "Con lo que tienes no llega ni para una ración."
        : `Con lo que tienes salen ${racionesPosibles}.`;
  } else if (raciones === racionesSugeridas && racionesSugeridas < receta.raciones) {
    texto = `Ajustada a tu despensa: la receta es para ${receta.raciones}.`;
  }
  if (texto === null && raciones === racionesSugeridas) return null;

  return (
    <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
      {texto}
      {raciones !== racionesSugeridas && (
        <button
          type="button"
          onClick={() => onVolver(racionesSugeridas)}
          className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Volver a {racionesSugeridas}
        </button>
      )}
    </p>
  );
}

function FilaIngrediente({
  ingrediente: i,
  conNota,
}: Readonly<{ ingrediente: IngredienteRecetaResponse; conNota: boolean }>) {
  const cantidad = [i.cantidad === null ? null : formatMedida(i.cantidad), conNota ? i.nota : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="flex min-w-0 flex-col">
        <span className="font-semibold">{i.nombre}</span>
        {cantidad !== "" && <span className="text-sm text-muted-foreground">{cantidad}</span>}
      </div>
      <EstadoIngrediente ingrediente={i} />
    </li>
  );
}

function EstadoIngrediente({
  ingrediente: i,
}: Readonly<{ ingrediente: IngredienteRecetaResponse }>) {
  const chip = "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold text-right";
  switch (i.estado) {
    case "tienes":
      return (
        <span
          className={cn(
            chip,
            "inline-flex items-center gap-1 bg-secondary text-secondary-foreground",
          )}
        >
          <Check className="size-3.5" aria-hidden="true" />
          {i.disponible === null ? "Tienes" : `Tienes ${formatMedida(i.disponible)}`}
        </span>
      );
    case "poco":
      return (
        <span
          className={cn(
            chip,
            "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
          )}
        >
          Faltan {i.falta === null ? "" : formatMedida(i.falta)}
        </span>
      );
    case "falta":
      return <span className={cn(chip, "bg-destructive/10 text-destructive")}>No tienes</span>;
    case "opcional":
      return <span className={cn(chip, "bg-muted text-muted-foreground")}>Opcional</span>;
    case "basico":
      return (
        <span className={cn(chip, "bg-muted text-muted-foreground")}>De fondo de armario</span>
      );
  }
}
