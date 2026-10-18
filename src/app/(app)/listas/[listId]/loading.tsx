import { Skeleton } from "@/shared/ui/skeleton";

/**
 * Next envuelve `page.tsx` en un <Suspense> cuyo fallback es este archivo:
 * se envía al instante mientras la página espera a la base de datos.
 * Imita la forma de la pantalla real para que no "salte" al llegar los datos.
 */
export default function Loading() {
  return (
    <section
      aria-busy="true"
      aria-label="Cargando la lista"
      className="mx-auto flex max-w-3xl flex-col gap-8 px-5 pt-4"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-7 w-32" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[0, 1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>
    </section>
  );
}
