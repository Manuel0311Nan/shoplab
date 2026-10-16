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
      className="mx-auto flex max-w-xl flex-col gap-6 p-4"
    >
      <div className="flex items-baseline justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </section>
  );
}
