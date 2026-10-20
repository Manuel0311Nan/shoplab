"use client";

import { useEffect } from "react";
import { Button } from "@/shared/ui/button";

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function RecetaError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex max-w-3xl flex-col gap-3 px-5 pt-4">
      <p>Algo se nos ha quedado en migas: no se ha podido cargar la receta.</p>
      {error.digest !== undefined && (
        <p className="text-sm text-muted-foreground">Referencia: {error.digest}</p>
      )}
      <Button onClick={reset} className="self-start">
        Reintentar
      </Button>
    </div>
  );
}
