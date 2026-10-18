import { Skeleton } from "@/shared/ui/skeleton";

export default function Loading() {
  return (
    <section
      aria-busy="true"
      aria-label="Cargando tus listas"
      className="mx-auto flex max-w-3xl flex-col gap-6 px-5 pt-4"
    >
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-13 w-full rounded-xl" />
      <Skeleton className="h-19 w-full rounded-xl" />
      {[0, 1, 2].map((n) => (
        <Skeleton key={n} className="h-22 w-full rounded-xl" />
      ))}
    </section>
  );
}
