"use client";
import { LogOut, Tags } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { authClient } from "@/app/_lib/auth/auth-client";

type Props = { nombre: string; email: string };

/** Botón de cuenta (44 px) con un panel: Mis productos y cerrar sesión. Se cierra con Escape o al pulsar fuera. */
export function MenuCuenta({ nombre, email }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [saliendo, startTransition] = useTransition();
  const panelId = useId();
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrarConEscape = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    const cerrarFuera = (e: PointerEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("keydown", cerrarConEscape);
    document.addEventListener("pointerdown", cerrarFuera);
    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
      document.removeEventListener("pointerdown", cerrarFuera);
    };
  }, [abierto]);

  function cerrarSesion() {
    startTransition(async () => {
      // Borra la sesión en la BD y la cookie.
      await authClient.signOut();
      router.replace("/login");
      router.refresh();
    });
  }

  const inicial = nombre.trim().charAt(0).toLocaleUpperCase("es-ES") || "?";

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-controls={panelId}
        aria-label={`Cuenta de ${nombre}`}
        className="flex size-11 items-center justify-center rounded-full bg-secondary font-heading text-lg font-bold text-secondary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {inicial}
      </button>
      {abierto && (
        <div
          id={panelId}
          className="absolute top-full right-0 z-50 mt-2 flex w-64 flex-col gap-1 rounded-xl bg-popover p-2 text-popover-foreground shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="truncate font-semibold">{nombre}</p>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </div>
          <Link
            href="/productos"
            onClick={() => setAbierto(false)}
            className="flex h-11 items-center gap-2 rounded-lg px-3 font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Tags className="size-5" aria-hidden="true" />
            Mis productos
          </Link>
          <button
            type="button"
            onClick={cerrarSesion}
            disabled={saliendo}
            className="flex h-11 items-center gap-2 rounded-lg px-3 text-left font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            <LogOut className="size-5" aria-hidden="true" />
            {saliendo ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
      )}
    </div>
  );
}
