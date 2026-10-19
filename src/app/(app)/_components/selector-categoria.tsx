"use client";
import { Menu } from "@base-ui/react/menu";
import { Check, ChevronDown } from "lucide-react";
import type { CategoriaDto } from "@/contracts/categoria";
import { CATEGORIAS, NOMBRE_CATEGORIA } from "@/shared/kernel/categoria";
import { cn } from "@/shared/lib/utils";

type Props = {
  categoria: CategoriaDto;
  /** Para la etiqueta accesible: "Categoría de Leche". */
  producto: string;
  onCambiar: (categoria: CategoriaDto) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Chip con la categoría de una línea; al tocarlo, la lista de categorías. Cambiarla
 * también la guarda en la memoria del hogar (lo hace el servidor).
 */
export function SelectorCategoria({ categoria, producto, onCambiar, disabled, className }: Props) {
  if (disabled) {
    return (
      <span className={cn("truncate text-xs text-muted-foreground", className)}>
        {NOMBRE_CATEGORIA[categoria]}
      </span>
    );
  }
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Categoría de ${producto}: ${NOMBRE_CATEGORIA[categoria]}. Cambiar`}
        className={cn(
          // Área táctil de 44 px aunque el chip se vea más pequeño.
          "relative flex max-w-full min-w-0 items-center gap-0.5 rounded-full text-xs text-muted-foreground outline-none after:absolute after:-inset-x-1 after:-inset-y-3 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
          className,
        )}
      >
        <span className="truncate">{NOMBRE_CATEGORIA[categoria]}</span>
        <ChevronDown className="size-3.5 shrink-0" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} className="z-50">
          <Menu.Popup className="flex max-h-[60dvh] w-64 flex-col overflow-y-auto rounded-xl bg-popover p-2 text-popover-foreground shadow-lg outline-none">
            {CATEGORIAS.map((c) => (
              <Menu.Item
                key={c}
                onClick={() => c !== categoria && onCambiar(c)}
                className="flex min-h-11 cursor-default items-center justify-between gap-3 rounded-lg px-3 text-base outline-none select-none data-[highlighted]:bg-muted"
              >
                {NOMBRE_CATEGORIA[c]}
                {c === categoria && <Check className="size-4 text-primary" aria-hidden="true" />}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
