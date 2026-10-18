"use client";
import { useFormStatus } from "react-dom";
import { Button } from "@/shared/ui/button";

type Props = { texto: string; textoEnviando: string };

/**
 * Botón de envío que se desactiva mientras el formulario trabaja.
 * Tiene que ser un componente HIJO del <form>: `useFormStatus` no ve el form del
 * componente que lo pinta.
 */
export function BotonEnviar({ texto, textoEnviando }: Readonly<Props>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="h-11 w-full text-base font-semibold">
      {pending ? textoEnviando : texto}
    </Button>
  );
}
