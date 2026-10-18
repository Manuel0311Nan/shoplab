import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { rutaSegura } from "@/app/_lib/auth/ruta-segura";
import { getIdentity } from "@/shared/kernel/auth-context";
import { LoginForm } from "../_components/login-form";

export const metadata: Metadata = { title: "Entrar · ShopList" };

type Props = { searchParams: Promise<{ next?: string | string[] }> };

export default async function LoginPage({ searchParams }: Props) {
  // Comprobación real (capa 2): el middleware solo miró si había cookie.
  if ((await getIdentity()).ok) redirect("/");

  const { next } = await searchParams;
  const destino = rutaSegura(typeof next === "string" ? next : null);

  return (
    <div className="flex flex-col gap-6">
      <LoginForm destino={destino} />
      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link
          href="/registro"
          className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline"
        >
          Regístrate
        </Link>
      </p>
    </div>
  );
}
