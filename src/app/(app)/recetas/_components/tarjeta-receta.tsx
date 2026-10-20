import { ChevronRight, Clock, Users } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { RecetaResumenResponse } from "@/contracts/recipes";
import { textoCaducaReceta, textoRaciones, unirEnFrase } from "./textos";

/** Una receta en la lista de sugerencias. Toda la tarjeta lleva al detalle. */
export function TarjetaReceta({ receta }: Readonly<{ receta: RecetaResumenResponse }>) {
  const caduca = textoCaducaReceta(receta.caduca);

  return (
    <Link
      href={`/recetas/${receta.id}` as Route}
      className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3 className="font-heading text-lg leading-snug font-semibold">{receta.nombre}</h3>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-4" aria-hidden="true" />
            {receta.minutos} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-4" aria-hidden="true" />
            {receta.sePuedeHacer
              ? textoRaciones(receta.racionesSugeridas, receta.raciones)
              : `Para ${receta.racionesSugeridas}`}
          </span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {caduca !== null && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
              {caduca}
            </span>
          )}
          {receta.sePuedeHacer ? (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
              Tienes todo
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              Te falta: {unirEnFrase(receta.queFalta)}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}
