"use client";
import { useActionState } from "react";
import { type AltaHogarState, altaHogarAction } from "@/app/actions/households";
import { BotonEnviar } from "./boton-enviar";
import { Campo } from "./campo";
import { ErrorFormulario } from "./error-formulario";

type Props = {
  /** Generado en el servidor: el mismo id en cada reenvío evita crear dos hogares. */
  hogarId: string;
  nombreSugerido: string;
};

/** Alta del hogar: esta sí es una Server Action, porque llama a nuestro use case. */
export function BienvenidaForm({ hogarId, nombreSugerido }: Props) {
  const [estado, accion] = useActionState<AltaHogarState, FormData>(altaHogarAction, {
    error: null,
    nombre: nombreSugerido,
  });

  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={hogarId} />
      <ErrorFormulario mensaje={estado.error} />
      <Campo
        etiqueta="Nombre del hogar"
        name="nombre"
        autoComplete="off"
        defaultValue={estado.nombre}
        pista="Lo verán las personas con las que compartas listas."
        maxLength={60}
        required
      />
      <BotonEnviar texto="Empezar" textoEnviando="Preparando tu hogar…" />
    </form>
  );
}
