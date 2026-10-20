import { Skeleton } from "@/shared/ui/skeleton";

export default function Loading() {
  return (
    <section
      aria-busy="true"
      aria-label="Cargando las recetas"
      className="mx-auto flex max-w-3xl flex-col gap-5 px-5 pt-4"
    >
      <Skeleton className="h-9 w-36" />
      <Skeleton className="h-5 w-56" />
      {[0, 1, 2, 3].map((n) => (
        <Skeleton key={n} className="h-24 w-full rounded-xl" />
      ))}
    </section>
  );
}
