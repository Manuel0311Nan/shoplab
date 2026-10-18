"use client";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { z } from "zod";
import { authClient } from "@/app/_lib/auth/auth-client";
import { mensajeDeErrorAuth } from "@/app/_lib/auth/mensajes";
import { loginRequestSchema } from "@/contracts/auth";
import { BotonEnviar } from "./boton-enviar";
import { Campo } from "./campo";
import { CampoPassword } from "./campo-password";
import { ErrorFormulario } from "./error-formulario";

interface Estado {
  readonly error: string | null;
  readonly campos: { email?: string[]; password?: string[] };
  /** Lo escrito, para no perderlo si falla. Nunca la contraseña. */
  readonly email: string;
}

const inicial: Estado = { error: null, campos: {}, email: "" };

/**
 * `<form action>` + `useActionState` con una acción de CLIENTE: llama a
 * `/api/v1/auth/sign-in/email` desde el navegador, así el login pasa por el
 * límite de peticiones (una Server Action con `auth.api` se lo saltaría).
 */
export function LoginForm({ destino }: { destino: string }) {
  const router = useRouter();

  const [estado, accion] = useActionState(async (_: Estado, formData: FormData) => {
    const datos = { email: formData.get("email"), password: formData.get("password") };
    const email = typeof datos.email === "string" ? datos.email : "";

    const parsed = loginRequestSchema.safeParse(datos);
    if (!parsed.success) {
      return { error: null, campos: z.flattenError(parsed.error).fieldErrors, email };
    }

    const { error } = await authClient.signIn.email(parsed.data);
    if (error) {
      return { error: mensajeDeErrorAuth(error, "login"), campos: {}, email };
    }

    // replace: "atrás" no vuelve al login. refresh: los Server Components leen la cookie nueva.
    // `destino` ya pasó por rutaSegura en el servidor: es una ruta interna.
    router.replace(destino as Route);
    router.refresh();
    return inicial;
  }, inicial);

  return (
    <form action={accion} noValidate className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <ErrorFormulario mensaje={estado.error} />
      <Campo
        etiqueta="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        defaultValue={estado.email}
        error={estado.campos.email?.at(0)}
        required
      />
      <CampoPassword
        etiqueta="Contraseña"
        name="password"
        autoComplete="current-password"
        error={estado.campos.password?.at(0)}
        required
      />
      <BotonEnviar texto="Entrar" textoEnviando="Entrando…" />
    </form>
  );
}
