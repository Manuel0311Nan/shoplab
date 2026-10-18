import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getIdentity } from "@/shared/kernel/auth-context";
import { RegistroForm } from "../_components/registro-form";

export const metadata: Metadata = { title: "Crear cuenta · Migas" };

export default async function RegistroPage() {
  if ((await getIdentity()).ok) redirect("/");

  return (
    <div className="flex flex-col gap-6">
      <RegistroForm />
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline"
        >
          Entra
        </Link>
      </p>
    </div>
  );
}
