import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getIdentity } from "@/shared/kernel/auth-context";
import {
  Acceso,
  Cabecera,
  Funcionamiento,
  Hero,
  Hogar,
  Pie,
  Precios,
  Problemas,
} from "./_components/secciones";

export const metadata: Metadata = {
  title: "Migas · Haz buenas migas con tu despensa",
  description:
    "Lista de la compra compartida, despensa con caducidades y recetas con lo que tienes en casa. Gratis para todo el hogar.",
};

/**
 * Home pública. Con sesión válida, la portada es la app: Mis listas.
 * El middleware deja pasar "/" sin cookie; aquí se valida la sesión de verdad (capa 2).
 */
export default async function Home() {
  if ((await getIdentity()).ok) redirect("/listas");

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Cabecera />
      <main>
        <Hero />
        <Problemas />
        <Funcionamiento />
        <Hogar />
        <Precios />
        <Acceso />
      </main>
      <Pie />
    </div>
  );
}
