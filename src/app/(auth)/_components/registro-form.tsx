"use client";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { z } from "zod";
import { authClient } from "@/app/_lib/auth/auth-client";
import { mensajeDeErrorAuth } from "@/app/_lib/auth/mensajes";
import { PASSWORD_MIN, registerRequestSchema } from "@/contracts/auth";
import { BotonEnviar } from "./boton-enviar";
import { Campo } from "./campo";
import { CampoPassword } from "./campo-password";
import { ErrorFormulario } from "./error-formulario";

interface Estado {
  readonly error: string | null;
  readonly campos: { name?: string[]; email?: string[]; password?: string[] };
  readonly name: string;
  readonly email: string;
}

const inicial: Estado = { error: null, campos: {}, name: "", email: "" };

const texto = (valor: FormDataEntryValue | null) => (typeof valor === "string" ? valor : "");

/** Registro desde el navegador (mismo motivo que el login: límite de peticiones). */
export function RegistroForm() {
  const router = useRouter();

  const [estado, accion] = useActionState(async (_: Estado, formData: FormData) => {
    const name = texto(formData.get("name"));
    const email = texto(formData.get("email"));

    const parsed = registerRequestSchema.safeParse({
      name,
      email,
      password: formData.get("password"),
    });
    if (!parsed.success) {
      return { error: null, campos: z.flattenError(parsed.error).fieldErrors, name, email };
    }

    // autoSignIn: si va bien, la sesión ya queda abierta.
    const { error } = await authClient.signUp.email(parsed.data);
    if (error) {
      return { error: mensajeDeErrorAuth(error, "registro"), campos: {}, name, email };
    }

    router.replace("/bienvenida");
    router.refresh();
    return inicial;
  }, inicial);

  return (
    <form action={accion} noValidate className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Crear cuenta</h1>
      <ErrorFormulario mensaje={estado.error} />
      <Campo
        etiqueta="Nombre"
        name="name"
        autoComplete="name"
        defaultValue={estado.name}
        error={estado.campos.name?.at(0)}
        required
      />
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
        autoComplete="new-password"
        pista={`Mínimo ${PASSWORD_MIN} caracteres`}
        error={estado.campos.password?.at(0)}
        required
      />
      <BotonEnviar texto="Crear cuenta" textoEnviando="Creando cuenta…" />
    </form>
  );
}
