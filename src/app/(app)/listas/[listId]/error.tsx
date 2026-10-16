"use client";

import { useEffect } from "react";
import { Button } from "@/shared/ui/button";

type Props = { error: Error & { digest?: string }; reset: () => void };

/**
 * Captura cualquier error inesperado de la página (el `throw` de page.tsx).
 * Tiene que ser componente de cliente porque `reset` vuelve a intentar el
 * render en el navegador. En producción `error.message` llega genérico: el
 * detalle está en los logs del servidor, localizable por `digest`.
 */
export default function ListError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex max-w-xl flex-col gap-3 p-4">
      <p>No se ha podido cargar la lista.</p>
      {error.digest !== undefined && (
        <p className="text-sm text-muted-foreground">Referencia: {error.digest}</p>
      )}
      <Button onClick={reset} className="self-start">
        Reintentar
      </Button>
    </div>
  );
}
