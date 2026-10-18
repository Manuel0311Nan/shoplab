"use client";
import { Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import {
  actualizarListaAction,
  cargarArchivadasAction,
  crearListaAction,
  eliminarListaAction,
} from "@/app/actions/shopping-lists";
import type {
  EstadoListasDto,
  LimiteDeListasDetails,
  ShoppingListPage,
  ShoppingListSummary,
} from "@/contracts/shopping";
import { newId } from "@/shared/kernel/ids";
import type { Result } from "@/shared/kernel/result";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ElegirListaDialog } from "../../_components/elegir-lista-dialog";
import { limiteDeListas } from "../../_components/errores";
import { BorrarListaDialog } from "./borrar-lista-dialog";
import { type AccionListas, aplicarAccionListas } from "./listas-reducer";
import { NuevaListaForm } from "./nueva-lista-form";
import { TarjetaLista } from "./tarjeta-lista";

type Props = { estado: EstadoListasDto; pagina: ShoppingListPage };

/** Lo que esperaba hueco cuando saltó LIMITE_DE_LISTAS. */
type Pendiente =
  | { readonly tipo: "crear"; readonly id: string; readonly nombre: string }
  | { readonly tipo: "desarchivar"; readonly id: string };

const PESTAÑAS: readonly { estado: EstadoListasDto; nombre: string }[] = [
  { estado: "activas", nombre: "Activas" },
  { estado: "archivadas", nombre: "Archivadas" },
];

export function MisListasScreen({ estado, pagina }: Props) {
  const router = useRouter();
  // Páginas traídas con "Cargar más" (solo archivadas).
  const [mas, setMas] = useState<ShoppingListSummary[]>([]);
  const [cursor, setCursor] = useState(pagina.nextCursor);
  const base = [...pagina.items, ...mas.filter((l) => !pagina.items.some((p) => p.id === l.id))];
  const [listas, aplicarOptimista] = useOptimistic(base, aplicarAccionListas);
  const [ocupado, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [limite, setLimite] = useState<{
    detalles: LimiteDeListasDetails;
    pendiente: Pendiente;
  } | null>(null);
  const [aBorrar, setABorrar] = useState<ShoppingListSummary | null>(null);

  function ejecutar(accion: AccionListas, llamada: () => Promise<Result<unknown>>) {
    setError(null);
    startTransition(async () => {
      aplicarOptimista(accion);
      const result = await llamada();
      if (result.ok) {
        setMas((actual) => aplicarAccionListas(actual, accion));
        return;
      }
      const detalles = limiteDeListas(result.error);
      if (detalles !== null && accion.tipo === "quitar") {
        setLimite({ detalles, pendiente: { tipo: "desarchivar", id: accion.id } });
      } else {
        setError(result.error.message);
      }
    });
  }

  function crear(nombre: string, id = newId(), archivarListaId?: string) {
    setError(null);
    startTransition(async () => {
      const result = await crearListaAction({
        id,
        nombre,
        ...(archivarListaId ? { archivarListaId } : {}),
      });
      if (result.ok) {
        // D3: tras crearla, directamente dentro.
        router.push(`/listas/${result.value.id}`);
        return;
      }
      const detalles = limiteDeListas(result.error);
      if (detalles !== null) setLimite({ detalles, pendiente: { tipo: "crear", id, nombre } });
      else setError(result.error.message);
    });
  }

  const desarchivar = (id: string, archivarListaId?: string) =>
    ejecutar({ tipo: "quitar", id }, () =>
      actualizarListaAction(id, {
        archivada: false,
        ...(archivarListaId ? { archivarListaId } : {}),
      }),
    );

  function elegirParaArchivar(archivarListaId: string) {
    const pendiente = limite?.pendiente;
    setLimite(null);
    if (pendiente?.tipo === "crear") crear(pendiente.nombre, pendiente.id, archivarListaId);
    if (pendiente?.tipo === "desarchivar") desarchivar(pendiente.id, archivarListaId);
  }

  function cargarMas() {
    if (cursor === null) return;
    startTransition(async () => {
      const result = await cargarArchivadasAction(cursor);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setMas((actual) => [...actual, ...result.value.items]);
      setCursor(result.value.nextCursor);
    });
  }

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6 px-5 pt-4 pb-8">
      <header className="flex flex-col gap-4">
        <h1 className="text-[28px] leading-9 font-bold">Mis listas</h1>
        <nav aria-label="Estado de las listas" className="flex gap-2 rounded-xl bg-muted p-1">
          {PESTAÑAS.map((p) => (
            <Link
              key={p.estado}
              href={p.estado === "activas" ? "/listas" : "/listas?estado=archivadas"}
              aria-current={p.estado === estado ? "page" : undefined}
              className={cn(
                "flex h-11 flex-1 items-center justify-center rounded-lg font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                p.estado === estado ? "bg-card shadow-card" : "text-muted-foreground",
              )}
            >
              {p.nombre}
            </Link>
          ))}
        </nav>
      </header>

      {estado === "activas" ? (
        <NuevaListaForm onCrear={(nombre) => crear(nombre)} creando={ocupado} />
      ) : (
        <p className="flex gap-3 rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
          <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          Las listas archivadas se borran 15 días después de archivarlas. Recupera una para seguir
          usándola.
        </p>
      )}

      {error !== null && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
        >
          {error}
        </p>
      )}

      {listas.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-muted-foreground">
          {estado === "activas"
            ? "No tienes listas. Crea una para empezar."
            : "No hay listas archivadas."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3" aria-busy={ocupado}>
          {listas.map((lista) => (
            <TarjetaLista
              key={lista.id}
              lista={lista}
              onRenombrar={(nombre) =>
                ejecutar({ tipo: "renombrar", id: lista.id, nombre }, () =>
                  actualizarListaAction(lista.id, { nombre }),
                )
              }
              onArchivar={() =>
                ejecutar({ tipo: "quitar", id: lista.id }, () =>
                  actualizarListaAction(lista.id, { archivada: true }),
                )
              }
              onDesarchivar={() => desarchivar(lista.id)}
              onBorrar={() => setABorrar(lista)}
            />
          ))}
        </ul>
      )}

      {estado === "archivadas" && cursor !== null && (
        <Button
          variant="outline"
          onClick={cargarMas}
          disabled={ocupado}
          className="h-11 self-center px-6 font-semibold"
        >
          {ocupado ? "Cargando…" : "Cargar más"}
        </Button>
      )}

      <ElegirListaDialog
        limite={limite?.detalles ?? null}
        motivo={limite?.pendiente.tipo ?? "crear"}
        onElegir={elegirParaArchivar}
        onCerrar={() => setLimite(null)}
      />
      <BorrarListaDialog
        lista={aBorrar}
        onCerrar={() => setABorrar(null)}
        onConfirmar={(id) => {
          setABorrar(null);
          ejecutar({ tipo: "quitar", id }, () => eliminarListaAction(id));
        }}
      />
    </section>
  );
}
