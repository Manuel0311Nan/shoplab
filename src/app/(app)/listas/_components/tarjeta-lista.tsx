"use client";
import { Menu } from "@base-ui/react/menu";
import { Archive, ArchiveRestore, MoreVertical, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ShoppingListSummary } from "@/contracts/shopping";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { formatDiaYMes } from "../../_components/fechas";

type Props = {
  lista: ShoppingListSummary;
  onRenombrar: (nombre: string) => void;
  onArchivar: () => void;
  onDesarchivar: () => void;
  onBorrar: () => void;
};

const opcion =
  "flex h-11 cursor-default items-center gap-3 rounded-lg px-3 text-base outline-none select-none data-[highlighted]:bg-muted";

function resumen(lista: ShoppingListSummary): string {
  if (lista.total === 0) return "Vacía";
  if (lista.pendientes === 0) return `Todo en el carro · ${lista.total}`;
  return `${lista.pendientes} por comprar · ${lista.total} en total`;
}

/** Tarjeta de Mis listas: toda la tarjeta abre la lista; el botón ⋯ abre las acciones. */
export function TarjetaLista({ lista, onRenombrar, onArchivar, onDesarchivar, onBorrar }: Props) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <li className="rounded-xl bg-card p-4 shadow-card">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const nombre = String(new FormData(e.currentTarget).get("nombre") ?? "").trim();
            if (nombre !== "" && nombre !== lista.nombre) onRenombrar(nombre);
            setEditando(false);
          }}
        >
          <Input
            name="nombre"
            defaultValue={lista.nombre}
            maxLength={80}
            aria-label="Nuevo nombre de la lista"
            autoFocus
            onKeyDown={(e) => e.key === "Escape" && setEditando(false)}
            className="h-11 flex-1 rounded-lg border-transparent bg-muted md:text-base"
          />
          <Button type="submit" className="h-11 px-4 font-semibold">
            Guardar
          </Button>
        </form>
      </li>
    );
  }

  return (
    <li className="relative flex rounded-xl bg-card shadow-card transition-transform active:scale-[0.99]">
      <Link
        href={`/listas/${lista.id}`}
        className="flex min-w-0 flex-1 flex-col gap-1 rounded-xl p-4 pr-14 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <h2 className="text-lg leading-7 font-semibold break-words">{lista.nombre}</h2>
        <p className="text-sm text-muted-foreground">{resumen(lista)}</p>
        {lista.caducaEl !== null && (
          <p className="text-sm font-medium text-destructive">
            Se borrará el {formatDiaYMes(lista.caducaEl)}
          </p>
        )}
      </Link>

      <Menu.Root>
        <Menu.Trigger
          aria-label={`Acciones de ${lista.nombre}`}
          className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-[popup-open]:bg-muted"
        >
          <MoreVertical className="size-5" aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="end" sideOffset={4} className="z-50">
            <Menu.Popup className="flex w-56 flex-col gap-1 rounded-xl bg-popover p-2 text-popover-foreground shadow-lg outline-none">
              <Menu.Item className={opcion} onClick={() => setEditando(true)}>
                <Pencil className="size-5" aria-hidden="true" />
                Renombrar
              </Menu.Item>
              {lista.archivada ? (
                <Menu.Item className={opcion} onClick={onDesarchivar}>
                  <ArchiveRestore className="size-5" aria-hidden="true" />
                  Recuperar
                </Menu.Item>
              ) : (
                <Menu.Item className={opcion} onClick={onArchivar}>
                  <Archive className="size-5" aria-hidden="true" />
                  Archivar
                </Menu.Item>
              )}
              <Menu.Item className={`${opcion} text-destructive`} onClick={onBorrar}>
                <Trash2 className="size-5" aria-hidden="true" />
                Borrar…
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </li>
  );
}
