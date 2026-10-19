"use client";
import { BookOpen, ListChecks, Package } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";

const PRONTO = [{ nombre: "Recetas", icono: BookOpen }] as const;

/**
 * Navegación principal en móvil. Recetas llega en la vista 4: se ve, pero desactivada
 * con "Pronto". Respeta la zona segura del iPhone.
 */
export function BarraInferior() {
  const ruta = usePathname();
  const enListas = ruta === "/" || ruta.startsWith("/listas");
  const enDespensa = ruta.startsWith("/despensa");

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid h-16 max-w-3xl grid-cols-3">
        <li>
          <Link
            href="/listas"
            aria-current={enListas ? "page" : undefined}
            className={cn(
              "flex h-full flex-col items-center justify-center gap-0.5 text-xs font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              enListas ? "text-primary" : "text-muted-foreground",
            )}
          >
            <ListChecks className="size-6" aria-hidden="true" />
            Listas
          </Link>
        </li>
        <li>
          <Link
            href="/despensa"
            aria-current={enDespensa ? "page" : undefined}
            className={cn(
              "flex h-full flex-col items-center justify-center gap-0.5 text-xs font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              enDespensa ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Package className="size-6" aria-hidden="true" />
            Despensa
          </Link>
        </li>
        {PRONTO.map(({ nombre, icono: Icono }) => (
          <li key={nombre}>
            <span
              aria-disabled="true"
              className="flex h-full flex-col items-center justify-center gap-0.5 text-xs font-semibold text-muted-foreground/60"
            >
              <Icono className="size-6" aria-hidden="true" />
              <span>
                {nombre} <span className="sr-only">(próximamente)</span>
              </span>
              <span
                aria-hidden="true"
                className="rounded-full bg-muted px-1.5 text-[10px] leading-4 text-muted-foreground"
              >
                Pronto
              </span>
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
