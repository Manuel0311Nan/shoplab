import { useId } from "react";
import { cn } from "@/shared/lib/utils";

type Props = Omit<React.ComponentProps<"input">, "id"> & {
  etiqueta: string;
  error?: string;
  pista?: string;
  /** Para meter un botón dentro del campo (mostrar contraseña). */
  accesorio?: React.ReactNode;
};

/** Campo con etiqueta visible, pista y error enlazados al input con `aria-describedby`. */
export function Campo({ etiqueta, error, pista, accesorio, className, ...input }: Props) {
  const id = useId();
  const pistaId = `${id}-pista`;
  const errorId = `${id}-error`;
  const describedBy = [pista && pistaId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error !== undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-11 w-full rounded-lg border border-transparent bg-muted px-3 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive",
            accesorio !== undefined && "pr-12",
            className,
          )}
          {...input}
        />
        {accesorio}
      </div>
      {pista !== undefined && error === undefined && (
        <p id={pistaId} className="text-xs text-muted-foreground">
          {pista}
        </p>
      )}
      {error !== undefined && (
        <p id={errorId} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
