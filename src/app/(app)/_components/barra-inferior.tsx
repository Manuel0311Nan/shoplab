"use client";
import { BookOpen, ListChecks, Package } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";

/** Navegación principal en móvil. Respeta la zona segura del iPhone. */
export function BarraInferior() {
  const ruta = usePathname();
  const enListas = ruta.startsWith("/listas");
  const enDespensa = ruta.startsWith("/despensa");
  const enRecetas = ruta.startsWith("/recetas");

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
        <li>
          <Link
            href="/recetas"
            aria-current={enRecetas ? "page" : undefined}
            className={cn(
              "flex h-full flex-col items-center justify-center gap-0.5 text-xs font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              enRecetas ? "text-primary" : "text-muted-foreground",
            )}
          >
            <BookOpen className="size-6" aria-hidden="true" />
            Recetas
          </Link>
        </li>
      </ul>
    </nav>
  );
}
