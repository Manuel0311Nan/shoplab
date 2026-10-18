import Link from "next/link";
import { getIdentity } from "@/shared/kernel/auth-context";
import { BarraInferior } from "./_components/barra-inferior";
import { MenuCuenta } from "./_components/menu-cuenta";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Solo para pintar el menú. Proteger las páginas es cosa de cada page.tsx (getAuthContext).
  const identity = await getIdentity();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between bg-background/90 px-5 backdrop-blur">
        <Link href="/listas" className="font-heading text-2xl font-bold text-primary">
          Migas
        </Link>
        {identity.ok && <MenuCuenta nombre={identity.value.nombre} email={identity.value.email} />}
      </header>
      {/* Hueco para la barra inferior (64 px + zona segura). */}
      <main className="pb-[calc(4rem+env(safe-area-inset-bottom))]">{children}</main>
      <BarraInferior />
    </div>
  );
}
