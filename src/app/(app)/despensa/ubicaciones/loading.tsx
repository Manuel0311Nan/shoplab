import { Skeleton } from "@/shared/ui/skeleton";

export default function Loading() {
  return (
    <section
      aria-busy="true"
      aria-label="Cargando la despensa"
      className="mx-auto flex max-w-3xl flex-col gap-5 px-5 pt-4"
    >
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-13 w-full rounded-xl" />
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-11 w-24 rounded-full" />
        ))}
      </div>
      {[0, 1, 2, 3].map((n) => (
        <Skeleton key={n} className="h-20 w-full rounded-xl" />
      ))}
    </section>
  );
}
